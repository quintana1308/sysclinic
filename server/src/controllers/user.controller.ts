import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId, hashPassword } from '../utils/auth';

export const getUsers = async (
  req: AuthenticatedRequest,
  res: Response<PaginatedResponse<any>>,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const role = req.query.role as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Solo usuarios master pueden ver todos los usuarios
    if (!req.user?.isMaster) {
      throw new AppError('No tienes permisos para ver usuarios del sistema', 403);
    }

    // Filtros de búsqueda
    if (search) {
      whereClause += ` AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status !== undefined) {
      whereClause += ` AND u.isActive = ?`;
      params.push(status === 'active' ? 1 : 0);
    }

    if (role) {
      whereClause += ` AND r.name LIKE ?`;
      params.push(`%${role}%`);
    }

    // Filtrar solo usuarios con rol empleado, administrador o cliente (excluir masters)
    whereClause += ` AND u.isMaster = 0`;
    
    // Filtrar por roles específicos si no se especifica un rol en los filtros
    if (!role) {
      whereClause += ` AND (LOWER(r.name) IN ('empleado', 'administrador', 'cliente') OR r.name IS NULL)`;
    }

    // Consulta principal sin LIMIT/OFFSET para compatibilidad Railway MySQL
    const usersQuery = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.isActive,
        u.isMaster,
        u.createdAt,
        u.updatedAt,
        GROUP_CONCAT(DISTINCT CONCAT(r.id, ':', r.name) SEPARATOR '|') as roles,
        GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.name) SEPARATOR '|') as companies
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      LEFT JOIN user_companies uc ON u.id = uc.userId
      LEFT JOIN companies c ON uc.companyId = c.id
      ${whereClause}
      GROUP BY u.id, u.firstName, u.lastName, u.email, u.phone, u.isActive, u.isMaster, u.createdAt, u.updatedAt
      HAVING (GROUP_CONCAT(DISTINCT r.name SEPARATOR '|') IS NULL OR 
              GROUP_CONCAT(DISTINCT LOWER(r.name) SEPARATOR '|') REGEXP 'empleado|administrador|cliente')
      ORDER BY u.createdAt DESC
    `;

    console.log('🔍 Ejecutando consulta de usuarios:', usersQuery);
    console.log('📋 Parámetros:', params);

    const users = await query(usersQuery, params);

    // Procesar los resultados para formatear roles y empresas
    const formattedUsers = users.map((user: any) => {
      // Procesar roles
      let roles: Array<{id: string, name: string}> = [];
      if (user.roles) {
        roles = user.roles.split('|').map((roleStr: string) => {
          const [id, name] = roleStr.split(':');
          return { id, name };
        });
      }

      // Procesar empresas
      let companies: Array<{id: string, name: string}> = [];
      if (user.companies) {
        companies = user.companies.split('|').map((companyStr: string) => {
          const [id, name] = companyStr.split(':');
          return { id, name };
        });
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isActive: Boolean(user.isActive),
        isMaster: Boolean(user.isMaster),
        roles,
        companies,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });

    // Consulta para contar total de usuarios (con los mismos filtros)
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      LEFT JOIN user_companies uc ON u.id = uc.userId
      LEFT JOIN companies c ON uc.companyId = c.id
      ${whereClause}
      HAVING (GROUP_CONCAT(DISTINCT r.name SEPARATOR '|') IS NULL OR 
              GROUP_CONCAT(DISTINCT LOWER(r.name) SEPARATOR '|') REGEXP 'empleado|administrador|cliente')
    `;

    // Aplicar paginación manual
    const paginatedUsers = formattedUsers.slice(offset, offset + limit);
    
    const [{ total }] = await query(countQuery, params);

    console.log(`✅ Usuarios encontrados: ${paginatedUsers.length} de ${total}`);

    res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: parseInt(total),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error en getUsers:', error);
    next(error);
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Solo usuarios master pueden ver detalles de usuarios
    if (!req.user?.isMaster) {
      throw new AppError('No tienes permisos para ver detalles de usuarios', 403);
    }

    const userQuery = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.isActive,
        u.isMaster,
        u.createdAt,
        u.updatedAt,
        GROUP_CONCAT(DISTINCT CONCAT(r.id, ':', r.name) SEPARATOR '|') as roles,
        GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.name) SEPARATOR '|') as companies
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      LEFT JOIN user_companies uc ON u.id = uc.userId
      LEFT JOIN companies c ON uc.companyId = c.id
      WHERE u.id = ?
      GROUP BY u.id, u.firstName, u.lastName, u.email, u.phone, u.isActive, u.isMaster, u.createdAt, u.updatedAt
    `;

    const user = await queryOne(userQuery, [id]);

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Procesar roles y empresas
    let roles: Array<{id: string, name: string}> = [];
    if (user.roles) {
      roles = user.roles.split('|').map((roleStr: string) => {
        const [id, name] = roleStr.split(':');
        return { id, name };
      });
    }

    let companies: Array<{id: string, name: string}> = [];
    if (user.companies) {
      companies = user.companies.split('|').map((companyStr: string) => {
        const [id, name] = companyStr.split(':');
        return { id, name };
      });
    }

    const formattedUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      isActive: Boolean(user.isActive),
      isMaster: Boolean(user.isMaster),
      roles,
      companies,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Usuario obtenido correctamente',
      data: formattedUser
    });

  } catch (error) {
    console.error('❌ Error en getUserById:', error);
    next(error);
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<null>>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Solo usuarios master pueden eliminar usuarios
    if (!req.user?.isMaster) {
      throw new AppError('No tienes permisos para eliminar usuarios', 403);
    }

    // Verificar que el usuario existe
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // No permitir eliminar usuarios master
    if (user.isMaster) {
      throw new AppError('No se puede eliminar un usuario master', 403);
    }

    // No permitir que un usuario se elimine a sí mismo
    if (user.id === req.user.id) {
      throw new AppError('No puedes eliminarte a ti mismo', 403);
    }

    console.log(`🗑️ Eliminando usuario completo: ${user.firstName} ${user.lastName} (${user.email})`);

    // Obtener información de roles para logs
    const userRoles = await query('SELECT r.name FROM user_roles ur JOIN roles r ON ur.roleId = r.id WHERE ur.userId = ?', [id]);
    const roleNames = userRoles.map((role: any) => role.name).join(', ');
    console.log(`   - Roles del usuario: ${roleNames || 'Sin roles'}`);

    // 1. Eliminar de tabla clients (si es cliente)
    const clientRecord = await queryOne('SELECT id FROM clients WHERE userId = ?', [id]);
    if (clientRecord) {
      await query('DELETE FROM clients WHERE userId = ?', [id]);
      console.log('✅ Registro de cliente eliminado');
    }

    // 2. Eliminar de tabla employees (si es empleado)
    const employeeRecord = await queryOne('SELECT id FROM employees WHERE userId = ?', [id]);
    if (employeeRecord) {
      await query('DELETE FROM employees WHERE userId = ?', [id]);
      console.log('✅ Registro de empleado eliminado');
    }

    // 3. Eliminar relaciones usuario-empresa
    const userCompanies = await query('SELECT companyId, role FROM user_companies WHERE userId = ?', [id]);
    if (userCompanies.length > 0) {
      await query('DELETE FROM user_companies WHERE userId = ?', [id]);
      console.log(`✅ ${userCompanies.length} relación(es) usuario-empresa eliminada(s)`);
      userCompanies.forEach((uc: any) => {
        console.log(`   - Empresa: ${uc.companyId}, Rol: ${uc.role}`);
      });
    }

    // 4. Eliminar roles globales
    const userRolesCount = await queryOne('SELECT COUNT(*) as count FROM user_roles WHERE userId = ?', [id]);
    if (userRolesCount.count > 0) {
      await query('DELETE FROM user_roles WHERE userId = ?', [id]);
      console.log(`✅ ${userRolesCount.count} rol(es) global(es) eliminado(s)`);
    }

    // 5. Eliminar registros relacionados adicionales
    // Eliminar historial médico creado por este usuario
    const medicalHistoryCount = await queryOne('SELECT COUNT(*) as count FROM medical_history WHERE createdBy = ?', [id]);
    if (medicalHistoryCount.count > 0) {
      await query('DELETE FROM medical_history WHERE createdBy = ?', [id]);
      console.log(`✅ ${medicalHistoryCount.count} registro(s) de historial médico eliminado(s)`);
    }

    // Eliminar movimientos de suministros creados por este usuario
    const supplyMovementsCount = await queryOne('SELECT COUNT(*) as count FROM supply_movements WHERE createdBy = ?', [id]);
    if (supplyMovementsCount.count > 0) {
      await query('DELETE FROM supply_movements WHERE createdBy = ?', [id]);
      console.log(`✅ ${supplyMovementsCount.count} movimiento(s) de suministros eliminado(s)`);
    }

    // Actualizar referencias en lugar de eliminar (para mantener integridad de datos históricos)
    // Actualizar appointments que referencian este usuario como empleado
    const appointmentsCount = await queryOne('SELECT COUNT(*) as count FROM appointments WHERE employeeId = ?', [id]);
    if (appointmentsCount.count > 0) {
      await query('UPDATE appointments SET employeeId = NULL WHERE employeeId = ?', [id]);
      console.log(`✅ ${appointmentsCount.count} cita(s) actualizadas (empleado removido)`);
    }

    // Actualizar audit_logs para mantener historial pero sin referencia activa
    const auditLogsCount = await queryOne('SELECT COUNT(*) as count FROM audit_logs WHERE userId = ?', [id]);
    if (auditLogsCount.count > 0) {
      await query('UPDATE audit_logs SET userId = NULL WHERE userId = ?', [id]);
      console.log(`✅ ${auditLogsCount.count} log(s) de auditoría actualizados`);
    }

    // 6. Finalmente, eliminar el usuario principal
    await query('DELETE FROM users WHERE id = ?', [id]);

    console.log('✅ Usuario eliminado completamente de todas las tablas relacionadas');

    res.json({
      success: true,
      message: 'Usuario eliminado correctamente',
      data: null
    });

  } catch (error) {
    console.error('❌ Error en deleteUser:', error);
    next(error);
  }
};

export const getUserStats = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    // Solo usuarios master pueden ver estadísticas
    if (!req.user?.isMaster) {
      throw new AppError('No tienes permisos para ver estadísticas de usuarios', 403);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN isActive = 1 THEN 1 END) as active,
        COUNT(CASE WHEN isActive = 0 THEN 1 END) as inactive,
        COUNT(CASE WHEN isMaster = 1 THEN 1 END) as masters
      FROM users
    `;

    const [stats] = await query(statsQuery);

    const roleStatsQuery = `
      SELECT 
        r.name as roleName,
        COUNT(ur.userId) as count
      FROM roles r
      LEFT JOIN user_roles ur ON r.id = ur.roleId
      GROUP BY r.id, r.name
      ORDER BY count DESC
    `;

    const roleStats = await query(roleStatsQuery);

    const byRole: Record<string, number> = {};
    roleStats.forEach((role: any) => {
      byRole[role.roleName] = parseInt(role.count);
    });

    res.json({
      success: true,
      message: 'Estadísticas obtenidas correctamente',
      data: {
        total: parseInt(stats.total),
        active: parseInt(stats.active),
        inactive: parseInt(stats.inactive),
        masters: parseInt(stats.masters),
        byRole
      }
    });

  } catch (error) {
    console.error('❌ Error en getUserStats:', error);
    next(error);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    console.log('🚀 INICIO updateUser - Datos recibidos:');
    console.log('   - URL params:', req.params);
    console.log('   - Body:', req.body);
    console.log('   - Usuario autenticado:', req.user ? `${req.user.firstName} ${req.user.lastName} (Master: ${req.user.isMaster})` : 'NO AUTENTICADO');
    
    const { id } = req.params;
    const { firstName, lastName, email, phone, isActive, roleId, companyId } = req.body;

    console.log('📝 Datos extraídos:');
    console.log(`   - ID usuario: ${id}`);
    console.log(`   - firstName: ${firstName}`);
    console.log(`   - lastName: ${lastName}`);
    console.log(`   - email: ${email}`);
    console.log(`   - phone: ${phone}`);
    console.log(`   - isActive: ${isActive}`);
    console.log(`   - roleId: ${roleId}`);
    console.log(`   - companyId: ${companyId}`);

    // Solo usuarios master pueden actualizar usuarios
    if (!req.user?.isMaster) {
      console.log('❌ Error: Usuario no es master');
      throw new AppError('No tienes permisos para actualizar usuarios', 403);
    }

    console.log('✅ Usuario master verificado');

    // Verificar que el usuario existe
    const existingUser = await queryOne('SELECT * FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // No permitir actualizar usuarios master
    if (existingUser.isMaster) {
      throw new AppError('No se puede actualizar un usuario master', 403);
    }

    // Verificar si el email ya existe en otro usuario
    if (email && email !== existingUser.email) {
      const emailExists = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailExists) {
        throw new AppError('El email ya está en uso por otro usuario', 400);
      }
    }

    console.log(`✏️ Actualizando usuario: ${existingUser.firstName} ${existingUser.lastName}`);

    // Actualizar datos del usuario
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
    updateData.updatedAt = new Date();

    console.log('📊 Datos a actualizar:', updateData);

    // Construir consulta de actualización dinámicamente
    const updateFields = Object.keys(updateData).map(field => `${field} = ?`).join(', ');
    const updateValues = Object.values(updateData);

    console.log('🔧 Consulta SQL:', `UPDATE users SET ${updateFields} WHERE id = ?`);
    console.log('🔧 Valores:', [...updateValues, id]);

    if (updateFields) {
      const result = await query(`UPDATE users SET ${updateFields} WHERE id = ?`, [...updateValues, id]);
      console.log('✅ Actualización de datos básicos completada');
    } else {
      console.log('ℹ️ No hay datos básicos para actualizar');
    }

    // Actualizar rol si se proporciona
    if (roleId) {
      // Verificar que el rol existe
      const roleExists = await queryOne('SELECT id, name FROM roles WHERE id = ?', [roleId]);
      if (!roleExists) {
        throw new AppError('Rol no encontrado', 400);
      }

      // Usar companyId del formulario o el del usuario autenticado como fallback
      const targetCompanyId = companyId || req.user?.currentCompanyId;

      // IMPORTANTE: Obtener roles anteriores ANTES de eliminarlos
      const previousRoles = await query('SELECT r.name FROM user_roles ur JOIN roles r ON ur.roleId = r.id WHERE ur.userId = ?', [id]);
      const hadClientRole = previousRoles.some((role: any) => role.name.toLowerCase() === 'cliente');
      const hadEmployeeRole = previousRoles.some((role: any) => role.name.toLowerCase() === 'empleado');
      
      const newRoleIsClient = roleExists.name.toLowerCase() === 'cliente';
      const newRoleIsEmployee = roleExists.name.toLowerCase() === 'empleado';
      const newRoleIsAdmin = roleExists.name.toLowerCase() === 'administrador';

      console.log(`🔄 Actualizando rol completo de usuario ${id}:`);
      console.log(`   - Rol anterior: ${previousRoles.map((r: any) => r.name).join(', ') || 'Sin rol'}`);
      console.log(`   - Nuevo rol: ${roleExists.name}`);
      console.log(`   - Empresa: ${targetCompanyId || 'Sin empresa'}`);
      console.log(`   - Tenía rol cliente: ${hadClientRole}`);
      console.log(`   - Tenía rol empleado: ${hadEmployeeRole}`);
      console.log(`   - Nuevo rol es cliente: ${newRoleIsClient}`);
      console.log(`   - Nuevo rol es empleado: ${newRoleIsEmployee}`);
      console.log(`   - Nuevo rol es admin: ${newRoleIsAdmin}`);

      // 1. Actualizar user_roles (roles globales)
      await query('DELETE FROM user_roles WHERE userId = ?', [id]);
      await query('INSERT INTO user_roles (userId, roleId) VALUES (?, ?)', [id, roleId]);
      console.log('✅ Rol global actualizado en user_roles');

      // 2. Actualizar user_companies (roles por empresa)
      if (targetCompanyId) {
        let companyRole = 'employee'; // Por defecto
        
        if (newRoleIsClient) companyRole = 'client';
        else if (newRoleIsAdmin) companyRole = 'admin';
        else if (newRoleIsEmployee) companyRole = 'employee';

        // Verificar si ya existe relación usuario-empresa
        const existingUserCompany = await queryOne('SELECT id FROM user_companies WHERE userId = ? AND companyId = ?', [id, targetCompanyId]);
        
        if (existingUserCompany) {
          // Actualizar rol existente
          await query('UPDATE user_companies SET role = ?, updatedAt = NOW() WHERE userId = ? AND companyId = ?', [companyRole, id, targetCompanyId]);
          console.log(`✅ Rol de empresa actualizado a: ${companyRole}`);
        } else {
          // Crear nueva relación usuario-empresa
          await query(`
            INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 1, NOW(), NOW())
          `, [generateId(), id, targetCompanyId, companyRole]);
          console.log(`✅ Nueva relación usuario-empresa creada con rol: ${companyRole}`);
        }
      }

      // 3. Sincronizar tabla clients
      console.log(`🔍 Evaluando cambios en tabla clients:`);
      console.log(`   - newRoleIsClient: ${newRoleIsClient}`);
      console.log(`   - hadClientRole: ${hadClientRole}`);
      console.log(`   - Condición crear cliente: ${newRoleIsClient && !hadClientRole}`);
      console.log(`   - Condición eliminar cliente: ${!newRoleIsClient && hadClientRole}`);
      
      if (newRoleIsClient && !hadClientRole) {
        // Usuario se convierte en cliente
        console.log('➕ Creando registro de cliente...');
        
        const existingClient = await queryOne('SELECT id FROM clients WHERE userId = ?', [id]);
        console.log(`   - Cliente existente encontrado: ${existingClient ? 'SÍ' : 'NO'}`);
        
        if (!existingClient && targetCompanyId) {
          const clientId = generateId();
          const clientCode = `CLI-${Date.now().toString().slice(-6)}`;
          
          await query(`
            INSERT INTO clients (id, userId, companyId, clientCode, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, NOW(), NOW())
          `, [clientId, id, targetCompanyId, clientCode]);
          
          console.log(`✅ Cliente creado con ID: ${clientId}, Código: ${clientCode}`);
        } else if (existingClient) {
          console.log('ℹ️ El registro de cliente ya existe');
        } else {
          console.log('⚠️ No se pudo crear cliente: falta companyId');
        }
        
      } else if (!newRoleIsClient && hadClientRole) {
        // Usuario deja de ser cliente
        console.log('➖ Eliminando registro de cliente...');
        const deleteResult = await query('DELETE FROM clients WHERE userId = ?', [id]);
        console.log(`✅ Registro de cliente eliminado`);
      } else {
        console.log('ℹ️ No se requieren cambios en tabla clients');
      }

      // 4. Sincronizar tabla employees
      console.log(`🔍 Evaluando cambios en tabla employees:`);
      console.log(`   - newRoleIsEmployee: ${newRoleIsEmployee}`);
      console.log(`   - hadEmployeeRole: ${hadEmployeeRole}`);
      console.log(`   - Condición crear empleado: ${newRoleIsEmployee && !hadEmployeeRole}`);
      console.log(`   - Condición eliminar empleado: ${!newRoleIsEmployee && hadEmployeeRole}`);
      
      if (newRoleIsEmployee && !hadEmployeeRole) {
        // Usuario se convierte en empleado
        console.log('➕ Creando registro de empleado...');
        
        const existingEmployee = await queryOne('SELECT id FROM employees WHERE userId = ?', [id]);
        console.log(`   - Empleado existente encontrado: ${existingEmployee ? 'SÍ' : 'NO'}`);
        
        if (!existingEmployee && targetCompanyId) {
          const employeeId = generateId();
          
          await query(`
            INSERT INTO employees (id, userId, companyId, position, hireDate, isActive, role, createdAt, updatedAt) 
            VALUES (?, ?, ?, 'Empleado General', CURDATE(), 1, 'employee', NOW(), NOW())
          `, [employeeId, id, targetCompanyId]);
          
          console.log(`✅ Empleado creado con ID: ${employeeId}`);
        } else if (existingEmployee) {
          console.log('ℹ️ El registro de empleado ya existe');
        } else {
          console.log('⚠️ No se pudo crear empleado: falta companyId');
        }
        
      } else if (!newRoleIsEmployee && hadEmployeeRole) {
        // Usuario deja de ser empleado
        console.log('➖ Eliminando registro de empleado...');
        await query('DELETE FROM employees WHERE userId = ?', [id]);
        console.log('✅ Registro de empleado eliminado');
      } else {
        console.log('ℹ️ No se requieren cambios en tabla employees');
      }
    }

    // DEBUGGING: Verificar estado final de todas las tablas
    console.log(`🔍 VERIFICACIÓN FINAL - Estado de tablas para usuario ${id}:`);
    
    const finalUserRoles = await query('SELECT r.name FROM user_roles ur JOIN roles r ON ur.roleId = r.id WHERE ur.userId = ?', [id]);
    console.log(`   - user_roles: ${finalUserRoles.map((r: any) => r.name).join(', ') || 'NINGUNO'}`);
    
    const finalUserCompanies = await query('SELECT companyId, role FROM user_companies WHERE userId = ?', [id]);
    console.log(`   - user_companies: ${finalUserCompanies.map((uc: any) => `${uc.companyId}:${uc.role}`).join(', ') || 'NINGUNO'}`);
    
    const finalClient = await queryOne('SELECT id, clientCode FROM clients WHERE userId = ?', [id]);
    console.log(`   - clients: ${finalClient ? `ID:${finalClient.id}, Código:${finalClient.clientCode}` : 'NINGUNO'}`);
    
    const finalEmployee = await queryOne('SELECT id, position FROM employees WHERE userId = ?', [id]);
    console.log(`   - employees: ${finalEmployee ? `ID:${finalEmployee.id}, Posición:${finalEmployee.position}` : 'NINGUNO'}`);

    // Obtener el usuario actualizado con roles y empresas
    const userQuery = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.isActive,
        u.isMaster,
        u.createdAt,
        u.updatedAt,
        GROUP_CONCAT(DISTINCT CONCAT(r.id, ':', r.name) SEPARATOR '|') as roles,
        GROUP_CONCAT(DISTINCT CONCAT(c.id, ':', c.name) SEPARATOR '|') as companies
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      LEFT JOIN user_companies uc ON u.id = uc.userId
      LEFT JOIN companies c ON uc.companyId = c.id
      WHERE u.id = ?
      GROUP BY u.id, u.firstName, u.lastName, u.email, u.phone, u.isActive, u.isMaster, u.createdAt, u.updatedAt
    `;

    const updatedUser = await queryOne(userQuery, [id]);

    // Procesar roles y empresas
    let roles: Array<{id: string, name: string}> = [];
    if (updatedUser.roles) {
      roles = updatedUser.roles.split('|').map((roleStr: string) => {
        const [id, name] = roleStr.split(':');
        return { id, name };
      });
    }

    let companies: Array<{id: string, name: string}> = [];
    if (updatedUser.companies) {
      companies = updatedUser.companies.split('|').map((companyStr: string) => {
        const [id, name] = companyStr.split(':');
        return { id, name };
      });
    }

    const formattedUser = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      isActive: Boolean(updatedUser.isActive),
      isMaster: Boolean(updatedUser.isMaster),
      roles,
      companies,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    console.log('✅ Usuario actualizado correctamente');

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: formattedUser
    });

  } catch (error) {
    console.error('❌ Error en updateUser:', error);
    next(error);
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any>>,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, email, phone, password, isActive = true, roleId, companyId: userCompanyId } = req.body;

    // Solo usuarios master pueden crear usuarios
    if (!req.user?.isMaster) {
      throw new AppError('No tienes permisos para crear usuarios', 403);
    }

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !password || !roleId || !userCompanyId) {
      throw new AppError('Faltan campos requeridos: firstName, lastName, email, password, roleId, companyId', 400);
    }

    // Verificar que el email no existe
    const emailExists = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (emailExists) {
      throw new AppError('El email ya está en uso', 400);
    }

    // Verificar que el rol existe
    const roleExists = await queryOne('SELECT id, name FROM roles WHERE id = ?', [roleId]);
    if (!roleExists) {
      throw new AppError('Rol no encontrado', 400);
    }

    console.log(`➕ Creando nuevo usuario con rol: ${roleExists.name}`);

    // Generar ID y hash de contraseña
    const userId = generateId();
    const hashedPassword = await hashPassword(password);

    // Crear usuario
    await query(`
      INSERT INTO users (id, firstName, lastName, email, phone, password, isActive, isMaster, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())
    `, [userId, firstName, lastName, email, phone || null, hashedPassword, isActive ? 1 : 0]);

    // Usar empresa del formulario
    const companyId = userCompanyId;

    // 1. Asignar rol global
    await query('INSERT INTO user_roles (userId, roleId) VALUES (?, ?)', [userId, roleId]);
    console.log('✅ Rol global asignado en user_roles');

    // 2. Crear relación usuario-empresa con rol específico
    if (companyId) {
      let companyRole = 'employee'; // Por defecto
      
      if (roleExists.name.toLowerCase() === 'cliente') companyRole = 'client';
      else if (roleExists.name.toLowerCase() === 'administrador') companyRole = 'admin';
      else if (roleExists.name.toLowerCase() === 'empleado') companyRole = 'employee';

      await query(`
        INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 1, NOW(), NOW())
      `, [generateId(), userId, companyId, companyRole]);
      
      console.log(`✅ Relación usuario-empresa creada con rol: ${companyRole}`);
    }

    // 3. Crear registros específicos según el rol
    if (roleExists.name.toLowerCase() === 'cliente') {
      console.log('➕ Creando registro de cliente para nuevo usuario...');
      
      const clientId = generateId();
      const clientCode = `CLI-${Date.now().toString().slice(-6)}`;
      
      await query(`
        INSERT INTO clients (id, userId, companyId, clientCode, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `, [clientId, userId, companyId, clientCode]);
      
      console.log(`✅ Cliente creado con ID: ${clientId}, Código: ${clientCode}`);
      
    } else if (roleExists.name.toLowerCase() === 'empleado') {
      console.log('➕ Creando registro de empleado para nuevo usuario...');
      
      const employeeId = generateId();
      
      await query(`
        INSERT INTO employees (id, userId, companyId, position, hireDate, isActive, role, createdAt, updatedAt) 
        VALUES (?, ?, ?, 'Empleado General', CURDATE(), 1, 'employee', NOW(), NOW())
      `, [employeeId, userId, companyId]);
      
      console.log(`✅ Empleado creado con ID: ${employeeId}`);
    }

    // Obtener el usuario creado con roles
    const userQuery = `
      SELECT 
        u.id,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.isActive,
        u.isMaster,
        u.createdAt,
        u.updatedAt,
        GROUP_CONCAT(DISTINCT CONCAT(r.id, ':', r.name) SEPARATOR '|') as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.userId
      LEFT JOIN roles r ON ur.roleId = r.id
      WHERE u.id = ?
      GROUP BY u.id, u.firstName, u.lastName, u.email, u.phone, u.isActive, u.isMaster, u.createdAt, u.updatedAt
    `;

    const createdUser = await queryOne(userQuery, [userId]);

    // Procesar roles
    let roles: Array<{id: string, name: string}> = [];
    if (createdUser.roles) {
      roles = createdUser.roles.split('|').map((roleStr: string) => {
        const [id, name] = roleStr.split(':');
        return { id, name };
      });
    }

    const formattedUser = {
      id: createdUser.id,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      email: createdUser.email,
      phone: createdUser.phone,
      isActive: Boolean(createdUser.isActive),
      isMaster: Boolean(createdUser.isMaster),
      roles,
      companies: [], // Los usuarios nuevos no tienen empresas asignadas inicialmente
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt
    };

    console.log('✅ Usuario creado correctamente');

    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: formattedUser
    });

  } catch (error) {
    console.error('❌ Error en createUser:', error);
    next(error);
  }
};

export const getRoles = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<any[]>>,
  next: NextFunction
) => {
  try {
    console.log('🔄 Obteniendo roles desde la base de datos...');
    
    const roles = await query('SELECT id, name FROM roles ORDER BY name');
    
    console.log('✅ Roles encontrados:', roles);
    console.log('📊 Número de roles:', roles?.length || 0);

    res.json({
      success: true,
      message: 'Roles obtenidos correctamente',
      data: roles
    });

  } catch (error) {
    console.error('❌ Error en getRoles:', error);
    next(error);
  }
};
