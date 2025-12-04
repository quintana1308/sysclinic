import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId, generateClientCode, hashPassword } from '../utils/auth';
import { canManageUsers } from '../middleware/permissions';

export const getEmployees = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const position = req.query.position as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtrar por empresa (obligatorio para usuarios no master)
    if (!req.user?.isMaster) {
      if (!req.user?.companies?.current?.id) {
        throw new AppError('Usuario no tiene empresa asignada', 403);
      }
      whereClause += ` AND e.companyId = ?`;
      params.push(req.user.companies.current.id);
    } else if (req.companyId) {
      // Si el master ha seleccionado una empresa específica
      whereClause += ` AND e.companyId = ?`;
      params.push(req.companyId);
    }

    if (search) {
      whereClause += ` AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ? OR e.position LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (position) {
      whereClause += ` AND e.position = ?`;
      params.push(position);
    }

    if (status !== undefined) {
      whereClause += ` AND u.isActive = ?`;
      params.push(status === 'active' ? 1 : 0);
    }

    // Obtener total de registros
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total
      FROM employees e
      INNER JOIN users u ON e.userId = u.id
      ${whereClause}
    `, params);

    const total = totalResult?.total || 0;

    // Obtener empleados paginados
    const employees = await query<any>(`
      SELECT 
        e.id,
        e.userId,
        e.position,
        e.specialties,
        e.schedule,
        e.salary,
        e.hireDate,
        e.isActive,
        e.createdAt,
        e.updatedAt,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.avatar,
        u.isActive as userActive,
        COUNT(DISTINCT a.id) as totalAppointments,
        COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completedAppointments
      FROM employees e
      INNER JOIN users u ON e.userId = u.id
      LEFT JOIN appointments a ON e.id = a.employeeId
      ${whereClause}
      GROUP BY e.id
      ORDER BY e.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const response: PaginatedResponse = {
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Obtener empresa actual para filtrar
    const companyId = req.user?.isMaster && req.companyId 
      ? req.companyId 
      : req.user?.companies?.current?.id;

    if (!companyId) {
      throw new AppError('No se puede determinar la empresa', 400);
    }

    const employee = await queryOne<any>(`
      SELECT 
        e.*,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.avatar,
        u.isActive as userActive,
        COUNT(DISTINCT a.id) as totalAppointments,
        COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN a.id END) as completedAppointments,
        AVG(CASE WHEN a.status = 'COMPLETED' THEN 5 ELSE NULL END) as avgRating
      FROM employees e
      INNER JOIN users u ON e.userId = u.id
      LEFT JOIN appointments a ON e.id = a.employeeId
      WHERE e.id = ? AND e.companyId = ?
      GROUP BY e.id
    `, [id, companyId]);

    if (!employee) {
      throw new AppError('Empleado no encontrado o no pertenece a tu empresa', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Empleado obtenido exitosamente',
      data: employee
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar permisos para crear empleados
    if (!canManageUsers(req.user)) {
      throw new AppError('No tienes permisos para crear empleados', 403);
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      position,
      specialties,
      schedule,
      salary,
      hireDate,
      password
    } = req.body;

    if (!firstName || !lastName || !email || !position) {
      throw new AppError('Nombre, apellido, email y posición son requeridos', 400);
    }

    // Obtener empresa actual
    const companyId = req.user?.isMaster && req.companyId 
      ? req.companyId 
      : req.user?.companies?.current?.id;

    if (!companyId) {
      throw new AppError('No se puede determinar la empresa para el empleado', 400);
    }

    // Verificar si el email ya existe
    const existingUser = await queryOne(`
      SELECT id FROM users WHERE email = ?
    `, [email.toLowerCase()]);

    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear usuario
    const userId = generateId();
    const employeePassword = password || 'Empleado123'; // Password por defecto
    const hashedPassword = await hashPassword(employeePassword);
    
    await query(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
    `, [userId, email.toLowerCase(), hashedPassword, firstName, lastName, phone || null, companyId]);

    // Crear empleado
    const employeeId = generateId();
    await query(`
      INSERT INTO employees (
        id, userId, companyId, position, specialties, schedule, salary, hireDate, isActive, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      employeeId, userId, companyId, position, specialties || null, 
      schedule ? JSON.stringify(schedule) : null, salary || null, 
      hireDate || new Date().toISOString().split('T')[0]
    ]);

    // Asignar rol de empleado
    const roleResult = await queryOne<any>(`SELECT id FROM roles WHERE name IN ('empleado', 'employee')`);
    if (roleResult) {
      await query(`
        INSERT INTO user_roles (id, userId, roleId)
        VALUES (?, ?, ?)
      `, [generateId(), userId, roleResult.id]);
    }

    // Crear relación usuario-empresa
    await query(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, 'employee', 1, NOW(), NOW())
    `, [generateId(), userId, companyId]);

    const response: ApiResponse = {
      success: true,
      message: 'Empleado creado exitosamente',
      data: {
        id: employeeId,
        userId,
        email: email.toLowerCase(),
        position,
        temporaryPassword: !password ? employeePassword : undefined
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar permisos para actualizar empleados
    if (!canManageUsers(req.user)) {
      throw new AppError('No tienes permisos para actualizar empleados', 403);
    }

    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      position,
      specialties,
      schedule,
      salary,
      hireDate,
      isActive
    } = req.body;

    // Obtener empresa actual para filtrar
    const companyId = req.user?.isMaster && req.companyId 
      ? req.companyId 
      : req.user?.companies?.current?.id;

    if (!companyId) {
      throw new AppError('No se puede determinar la empresa', 400);
    }

    const employee = await queryOne<any>(`
      SELECT e.*, u.id as userId FROM employees e
      INNER JOIN users u ON e.userId = u.id
      WHERE e.id = ? AND e.companyId = ?
    `, [id, companyId]);

    if (!employee) {
      throw new AppError('Empleado no encontrado o no pertenece a tu empresa', 404);
    }

    // Actualizar usuario
    const userUpdateFields = [];
    const userUpdateValues = [];

    if (firstName !== undefined) {
      userUpdateFields.push('firstName = ?');
      userUpdateValues.push(firstName);
    }
    if (lastName !== undefined) {
      userUpdateFields.push('lastName = ?');
      userUpdateValues.push(lastName);
    }
    if (phone !== undefined) {
      userUpdateFields.push('phone = ?');
      userUpdateValues.push(phone);
    }
    if (isActive !== undefined) {
      userUpdateFields.push('isActive = ?');
      userUpdateValues.push(isActive);
    }

    if (userUpdateFields.length > 0) {
      userUpdateFields.push('updatedAt = NOW()');
      userUpdateValues.push(employee.userId);

      await query(`
        UPDATE users 
        SET ${userUpdateFields.join(', ')}
        WHERE id = ?
      `, userUpdateValues);
    }

    // Actualizar empleado
    const employeeUpdateFields = [];
    const employeeUpdateValues = [];

    if (position !== undefined) {
      employeeUpdateFields.push('position = ?');
      employeeUpdateValues.push(position);
    }
    if (specialties !== undefined) {
      employeeUpdateFields.push('specialties = ?');
      employeeUpdateValues.push(specialties);
    }
    if (schedule !== undefined) {
      employeeUpdateFields.push('schedule = ?');
      employeeUpdateValues.push(schedule ? JSON.stringify(schedule) : null);
    }
    if (salary !== undefined) {
      employeeUpdateFields.push('salary = ?');
      employeeUpdateValues.push(salary);
    }
    if (hireDate !== undefined) {
      employeeUpdateFields.push('hireDate = ?');
      employeeUpdateValues.push(hireDate);
    }

    if (employeeUpdateFields.length > 0) {
      employeeUpdateFields.push('updatedAt = NOW()');
      employeeUpdateValues.push(id);

      await query(`
        UPDATE employees 
        SET ${employeeUpdateFields.join(', ')}
        WHERE id = ?
      `, employeeUpdateValues);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Empleado actualizado exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar permisos para eliminar empleados
    if (!canManageUsers(req.user)) {
      throw new AppError('No tienes permisos para eliminar empleados', 403);
    }

    const { id } = req.params;

    // Obtener empresa actual para filtrar
    const companyId = req.user?.isMaster && req.companyId 
      ? req.companyId 
      : req.user?.companies?.current?.id;

    if (!companyId) {
      throw new AppError('No se puede determinar la empresa', 400);
    }

    const employee = await queryOne<any>(`
      SELECT e.*, u.id as userId FROM employees e
      INNER JOIN users u ON e.userId = u.id
      WHERE e.id = ? AND e.companyId = ?
    `, [id, companyId]);

    if (!employee) {
      throw new AppError('Empleado no encontrado o no pertenece a tu empresa', 404);
    }

    // Verificar si tiene citas asignadas
    const hasAppointments = await queryOne<any>(`
      SELECT COUNT(*) as count FROM appointments WHERE employeeId = ?
    `, [id]);

    if (hasAppointments && hasAppointments.count > 0) {
      throw new AppError('No se puede eliminar un empleado con citas asignadas', 400);
    }

    // Eliminar empleado (esto desactivará el usuario)
    await query(`UPDATE employees SET isActive = 0, updatedAt = NOW() WHERE id = ?`, [id]);
    await query(`UPDATE users SET isActive = 0, updatedAt = NOW() WHERE id = ?`, [employee.userId]);

    const response: ApiResponse = {
      success: true,
      message: 'Empleado desactivado exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeSchedule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    // Obtener empresa actual para filtrar
    const companyId = req.user?.isMaster && req.companyId 
      ? req.companyId 
      : req.user?.companies?.current?.id;

    if (!companyId) {
      throw new AppError('No se puede determinar la empresa', 400);
    }

    const employee = await queryOne<any>(`
      SELECT e.schedule FROM employees e
      WHERE e.id = ? AND e.companyId = ?
    `, [id, companyId]);

    if (!employee) {
      throw new AppError('Empleado no encontrado o no pertenece a tu empresa', 404);
    }

    // Obtener citas del empleado para la fecha específica
    let appointments = [];
    if (date) {
      appointments = await query<any>(`
        SELECT 
          a.id,
          a.startTime,
          a.endTime,
          a.status,
          c.firstName as clientFirstName,
          c.lastName as clientLastName,
          GROUP_CONCAT(t.name) as treatments
        FROM appointments a
        JOIN clients cl ON a.clientId = cl.id
        JOIN users c ON cl.userId = c.id
        LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
        LEFT JOIN treatments t ON at.treatmentId = t.id
        WHERE a.employeeId = ? AND DATE(a.date) = ?
        GROUP BY a.id
        ORDER BY a.startTime
      `, [id, date]);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Horario del empleado obtenido exitosamente',
      data: {
        schedule: employee.schedule ? JSON.parse(employee.schedule) : null,
        appointments: appointments
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export default {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSchedule
};
