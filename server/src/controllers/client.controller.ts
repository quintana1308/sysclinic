import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId, generateClientCode } from '../utils/auth';
import { canDeleteClients } from '../middleware/permissions';
import bcrypt from 'bcryptjs';

// Endpoint temporal para verificar datos en la BD
export const checkDatabaseData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Verificando datos en la base de datos...');
    
    // Contar usuarios
    const usersCount = await queryOne<{ total: number }>(`SELECT COUNT(*) as total FROM users`);
    console.log('👥 Total usuarios:', usersCount?.total);
    
    // Contar clientes
    const clientsCount = await queryOne<{ total: number }>(`SELECT COUNT(*) as total FROM clients`);
    console.log('🏥 Total clientes:', clientsCount?.total);
    
    // Contar empresas
    const companiesCount = await queryOne<{ total: number }>(`SELECT COUNT(*) as total FROM companies`);
    console.log('🏢 Total empresas:', companiesCount?.total);
    
    // Contar relaciones usuario-empresa
    const userCompaniesCount = await queryOne<{ total: number }>(`SELECT COUNT(*) as total FROM user_companies`);
    console.log('🔗 Total relaciones usuario-empresa:', userCompaniesCount?.total);
    
    // Obtener algunos usuarios de ejemplo
    const sampleUsers = await query<any>(`SELECT id, email, firstName, lastName, isActive FROM users LIMIT 5`);
    console.log('👤 Usuarios de ejemplo:', sampleUsers);
    
    // Obtener algunos clientes de ejemplo
    const sampleClients = await query<any>(`
      SELECT c.id, c.clientCode, u.firstName, u.lastName, u.email 
      FROM clients c 
      INNER JOIN users u ON c.userId = u.id 
      LIMIT 5
    `);
    console.log('🏥 Clientes de ejemplo:', sampleClients);
    
    const response = {
      success: true,
      data: {
        counts: {
          users: usersCount?.total || 0,
          clients: clientsCount?.total || 0,
          companies: companiesCount?.total || 0,
          userCompanies: userCompaniesCount?.total || 0
        },
        samples: {
          users: sampleUsers,
          clients: sampleClients
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    next(error);
  }
};

export const getClients = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Obteniendo clientes - Usuario:', req.user?.email);
    console.log('🏢 Empresa actual:', req.user?.currentCompanyId);
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    // Validar que limit y offset sean números válidos
    if (isNaN(limit) || isNaN(offset) || limit <= 0 || offset < 0) {
      console.error('❌ Parámetros de paginación inválidos:', { page, limit, offset });
      return res.status(400).json({
        success: false,
        message: 'Parámetros de paginación inválidos'
      });
    }

    console.log('📊 Parámetros de paginación:', { page, limit, offset });

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtrar por empresa (obligatorio para usuarios no master)
    // Nota: La relación empresa-cliente es a través de user_companies
    if (!req.user?.isMaster) {
      if (!req.user?.companies?.current?.id) {
        console.log('⚠️ Usuario no master sin empresa asignada');
        // Para usuarios no master, mostrar solo sus clientes
        // Por ahora, permitir ver todos los clientes para debugging
      } else {
        whereClause += ` AND EXISTS (SELECT 1 FROM user_companies uc WHERE uc.userId = u.id AND uc.companyId = ?)`;
        params.push(req.user.companies.current.id);
      }
    } else if (req.companyId) {
      // Si el master ha seleccionado una empresa específica
      whereClause += ` AND EXISTS (SELECT 1 FROM user_companies uc WHERE uc.userId = u.id AND uc.companyId = ?)`;
      params.push(req.companyId);
    }

    if (search) {
      whereClause += ` AND (u.firstName LIKE ? OR u.lastName LIKE ? OR u.email LIKE ? OR c.clientCode LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status !== undefined) {
      whereClause += ` AND u.isActive = ?`;
      params.push(status === 'active' ? 1 : 0);
    }

    // Obtener total de registros
    console.log('📊 Ejecutando consulta de conteo con whereClause:', whereClause);
    console.log('📊 Parámetros:', params);
    
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
      ${whereClause}
    `, params);

    const total = totalResult?.total || 0;
    console.log('📊 Total de clientes encontrados:', total);

    // Obtener clientes paginados
    const finalParams = [...params, limit, offset];
    console.log('📊 Parámetros finales para consulta principal:', finalParams);
    console.log('📊 Tipos de parámetros:', finalParams.map(p => typeof p));
    console.log('📊 Valores: limit =', limit, ', offset =', offset);
    
    // Consulta ultra-básica para debugging Railway MySQL
    console.log('🔍 Probando consulta básica sin LIMIT/OFFSET...');
    
    let clients: any[] = [];
    
    try {
      // Primero probar sin LIMIT/OFFSET
      const testQuery = await query<any>(`
        SELECT c.id, c.clientCode, c.createdAt, c.updatedAt, c.userId,
               u.firstName, u.lastName, u.email, u.phone, u.isActive
        FROM clients c
        INNER JOIN users u ON c.userId = u.id
        ${whereClause}
        ORDER BY c.createdAt DESC
      `, params);
      
      console.log('✅ Consulta básica exitosa, registros:', testQuery.length);
      
      // Ahora aplicar paginación manualmente
      const startIndex = offset;
      const endIndex = offset + limit;
      clients = testQuery.slice(startIndex, endIndex).map((client: any) => ({
        ...client,
        userId: client.userId || '',
        clientCode: client.clientCode || '',
        dateOfBirth: null,
        age: null,
        gender: null,
        address: null,
        emergencyContact: null,
        medicalConditions: null,
        allergies: null,
        createdAt: client.createdAt || new Date(),
        updatedAt: client.updatedAt || new Date(),
        email: client.email || '',
        phone: client.phone || null,
        isActive: client.isActive !== undefined ? client.isActive : true,
        totalAppointments: 0,
        completedAppointments: 0
      }));
      
      console.log('📊 Clientes paginados manualmente:', clients.length);
      
    } catch (basicError) {
      console.error('❌ Error en consulta básica:', basicError);
      throw basicError;
    }

    // Obtener estadísticas de citas por separado para evitar problemas con GROUP BY
    if (clients.length > 0) {
      const clientIds = clients.map((c: any) => c.id);
      const placeholders = clientIds.map(() => '?').join(',');
      
      const appointmentStats = await query<any>(`
        SELECT 
          a.clientId,
          COUNT(*) as totalAppointments,
          COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completedAppointments
        FROM appointments a
        WHERE a.clientId IN (${placeholders})
        GROUP BY a.clientId
      `, clientIds);

      // Combinar estadísticas con datos de clientes
      clients.forEach((client: any) => {
        const stats = appointmentStats.find((stat: any) => stat.clientId === client.id);
        if (stats) {
          client.totalAppointments = stats.totalAppointments;
          client.completedAppointments = stats.completedAppointments;
        }
      });
    }

    const response: PaginatedResponse = {
      success: true,
      data: clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

export const getClientById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    console.log('🔍 Obteniendo cliente por ID:', id);

    // Obtener datos completos del cliente
    const client = await queryOne<any>(`
      SELECT 
        c.id,
        c.userId,
        c.clientCode,
        c.dateOfBirth,
        c.age,
        c.gender,
        c.address,
        c.emergencyContact,
        c.medicalConditions,
        c.allergies,
        c.companyId,
        c.createdAt,
        c.updatedAt,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.isActive,
        u.createdAt as userCreatedAt
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `, [id]);

    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    console.log('📋 Cliente encontrado:', {
      id: client.id,
      name: `${client.firstName} ${client.lastName}`,
      email: client.email,
      phone: client.phone,
      clientCode: client.clientCode
    });

    // Obtener estadísticas de citas por separado
    const appointmentStats = await queryOne<any>(`
      SELECT 
        COUNT(*) as totalAppointments,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedAppointments,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelledAppointments,
        COUNT(CASE WHEN status IN ('SCHEDULED', 'CONFIRMED') THEN 1 END) as upcomingAppointments
      FROM appointments 
      WHERE clientId = ?
    `, [id]);

    // Obtener total pagado por separado
    const paymentStats = await queryOne<any>(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as totalPaid,
        COUNT(CASE WHEN status = 'PAID' THEN 1 END) as totalPayments
      FROM payments 
      WHERE clientId = ?
    `, [id]);

    // Combinar todos los datos
    const completeClient = {
      ...client,
      totalAppointments: appointmentStats?.totalAppointments || 0,
      completedAppointments: appointmentStats?.completedAppointments || 0,
      cancelledAppointments: appointmentStats?.cancelledAppointments || 0,
      upcomingAppointments: appointmentStats?.upcomingAppointments || 0,
      totalPaid: paymentStats?.totalPaid || 0,
      totalPayments: paymentStats?.totalPayments || 0
    };

    console.log('📊 Estadísticas del cliente:', {
      totalAppointments: completeClient.totalAppointments,
      completedAppointments: completeClient.completedAppointments,
      totalPaid: completeClient.totalPaid
    });

    const response: ApiResponse = {
      success: true,
      message: 'Cliente obtenido exitosamente',
      data: completeClient
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error obteniendo cliente por ID:', error);
    next(error);
  }
};

export const createClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      age,
      gender,
      address,
      emergencyContact,
      medicalConditions,
      allergies
    } = req.body;

    if (!firstName || !lastName || !email) {
      throw new AppError('Nombre, apellido y email son requeridos', 400);
    }

    if (!password || password.length < 6) {
      throw new AppError('La contraseña es requerida y debe tener al menos 6 caracteres', 400);
    }

    // Validar longitud del teléfono
    if (phone && phone.length > 50) {
      throw new AppError('El número de teléfono no puede tener más de 50 caracteres', 400);
    }

    // Convertir dateOfBirth al formato correcto para MySQL (YYYY-MM-DD)
    let formattedDateOfBirth = null;
    if (dateOfBirth) {
      try {
        const date = new Date(dateOfBirth);
        formattedDateOfBirth = date.toISOString().split('T')[0]; // Obtener solo YYYY-MM-DD
      } catch (error) {
        console.error('❌ Error convirtiendo fecha en createClient:', error);
      }
    }

    // Obtener empresa actual
    let companyId = req.user?.isMaster && req.companyId 
      ? req.companyId 
      : req.user?.companies?.current?.id || req.user?.currentCompanyId;

    // Si es master y no tiene empresa asignada, usar la primera empresa disponible
    if (!companyId && req.user?.isMaster && req.user?.companies?.available?.ids?.length > 0) {
      companyId = req.user.companies.available.ids[0];
      console.log('🔧 Master sin empresa asignada, usando primera empresa disponible:', companyId);
    }

    if (!companyId) {
      console.error('❌ No se puede determinar companyId:', {
        isMaster: req.user?.isMaster,
        reqCompanyId: req.companyId,
        companiesCurrent: req.user?.companies?.current?.id,
        currentCompanyId: req.user?.currentCompanyId,
        availableCompanies: req.user?.companies?.available?.ids?.length || 0,
        user: req.user
      });
      throw new AppError('No se puede determinar la empresa para el cliente. El usuario master debe tener al menos una empresa disponible.', 400);
    }

    console.log('✅ CompanyId determinado:', companyId);

    // Verificar si el email ya existe
    const existingUser = await queryOne(`
      SELECT id FROM users WHERE email = ?
    `, [email.toLowerCase()]);

    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Crear usuario
    const userId = generateId();
    const clientCode = generateClientCode();
    
    // Hashear la contraseña proporcionada
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('🔑 Contraseña registrada para el cliente:', email.toLowerCase());
    
    await query(`
      INSERT INTO users (id, email, password, firstName, lastName, phone, isActive, currentCompanyId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())
    `, [userId, email.toLowerCase(), hashedPassword, firstName, lastName, phone || null, companyId]);

    // Crear cliente
    const clientId = generateId();
    await query(`
      INSERT INTO clients (
        id, userId, companyId, clientCode, dateOfBirth, age, gender, address, 
        emergencyContact, medicalConditions, allergies, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      clientId, userId, companyId, clientCode, formattedDateOfBirth, age || null, gender || null, 
      address || null, emergencyContact || null, medicalConditions || null, 
      allergies || null
    ]);

    // Asignar rol de cliente
    const roleResult = await queryOne<any>(`SELECT id FROM roles WHERE name = 'client'`);
    if (roleResult) {
      await query(`
        INSERT INTO user_roles (id, userId, roleId)
        VALUES (?, ?, ?)
      `, [generateId(), userId, roleResult.id]);
    }

    // Crear relación usuario-empresa
    await query(`
      INSERT INTO user_companies (id, userId, companyId, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, 'client', 1, NOW(), NOW())
    `, [generateId(), userId, companyId]);

    const response: ApiResponse = {
      success: true,
      message: 'Cliente creado exitosamente',
      data: {
        id: clientId,
        userId,
        clientCode,
        email: email.toLowerCase(),
        tempPassword: password // Contraseña ingresada para comunicar al cliente
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      age,
      gender,
      address,
      emergencyContact,
      medicalConditions,
      allergies
    } = req.body;

    console.log(`🔄 Actualizando cliente ${id} por usuario ${req.user?.email}`);
    // Convertir dateOfBirth al formato correcto para MySQL (YYYY-MM-DD)
    let formattedDateOfBirth = null;
    if (dateOfBirth) {
      try {
        const date = new Date(dateOfBirth);
        formattedDateOfBirth = date.toISOString().split('T')[0]; // Obtener solo YYYY-MM-DD
      } catch (error) {
        console.error('❌ Error convirtiendo fecha:', error);
      }
    }

    console.log('📋 Datos recibidos:', {
      firstName,
      lastName,
      email,
      phone: phone ? `"${phone}" (${phone.length} caracteres)` : 'null',
      dateOfBirth: `${dateOfBirth} → ${formattedDateOfBirth}`,
      age,
      gender,
      address,
      emergencyContact,
      medicalConditions,
      allergies
    });

    // Verificar que el cliente existe y obtener información de empresa
    const client = await queryOne<any>(`
      SELECT c.*, u.id as userId, u.email as currentEmail, c.companyId 
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `, [id]);

    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    // Verificar permisos de empresa (solo master puede editar clientes de cualquier empresa)
    if (!req.user?.isMaster) {
      const userCompanyId = req.user?.companies?.current?.id || req.user?.currentCompanyId;
      if (!userCompanyId) {
        throw new AppError('No se puede determinar la empresa del usuario', 400);
      }
      
      if (client.companyId !== userCompanyId) {
        throw new AppError('No tienes permisos para editar este cliente', 403);
      }
    }

    // Validaciones
    if (!firstName || !lastName) {
      throw new AppError('Nombre y apellido son requeridos', 400);
    }

    // Validar longitud del teléfono
    if (phone && phone.length > 50) {
      throw new AppError('El número de teléfono no puede tener más de 50 caracteres', 400);
    }

    // Si se proporciona email, verificar que no esté en uso por otro usuario
    if (email && email.toLowerCase() !== client.currentEmail.toLowerCase()) {
      const existingUser = await queryOne(`
        SELECT id FROM users WHERE email = ? AND id != ?
      `, [email.toLowerCase(), client.userId]);

      if (existingUser) {
        throw new AppError('El email ya está registrado por otro usuario', 400);
      }
    }

    // Preparar datos para actualizar usuario
    let userUpdateQuery = `
      UPDATE users 
      SET firstName = ?, lastName = ?, phone = ?, updatedAt = NOW()
    `;
    let userParams = [firstName, lastName, phone || null];

    // Agregar email si se proporciona
    if (email) {
      userUpdateQuery = userUpdateQuery.replace('updatedAt = NOW()', 'email = ?, updatedAt = NOW()');
      userParams.push(email.toLowerCase()); // Agregar al final
    }

    // Agregar contraseña si se proporciona
    if (password && password.trim()) {
      if (password.length < 6) {
        throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      userUpdateQuery = userUpdateQuery.replace('updatedAt = NOW()', 'password = ?, updatedAt = NOW()');
      userParams.push(hashedPassword); // Agregar al final
    }

    userUpdateQuery += ' WHERE id = ?';
    userParams.push(client.userId);

    // Logging para debug
    console.log('🔍 SQL Query:', userUpdateQuery);
    console.log('🔍 SQL Params:', userParams.map((param, index) => 
      `[${index}] ${typeof param} "${param}" (${param ? param.length : 0} chars)`
    ));

    // Actualizar usuario
    await query(userUpdateQuery, userParams);

    // Actualizar cliente
    await query(`
      UPDATE clients 
      SET dateOfBirth = ?, age = ?, gender = ?, address = ?, emergencyContact = ?, 
          medicalConditions = ?, allergies = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      formattedDateOfBirth, age ? parseInt(age) : null, gender || null, address || null, 
      emergencyContact || null, medicalConditions || null, 
      allergies || null, id
    ]);

    console.log(`✅ Cliente ${id} actualizado exitosamente`);

    const response: ApiResponse = {
      success: true,
      message: 'Cliente actualizado exitosamente'
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    next(error);
  }
};

export const toggleClientStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const client = await queryOne<any>(`
      SELECT c.*, u.isActive FROM clients c
      INNER JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `, [id]);

    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    const newStatus = !client.isActive;
    
    await query(`
      UPDATE users SET isActive = ?, updatedAt = NOW()
      WHERE id = ?
    `, [newStatus ? 1 : 0, client.userId]);

    const response: ApiResponse = {
      success: true,
      message: `Cliente ${newStatus ? 'activado' : 'desactivado'} exitosamente`
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteClient = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    console.log(`🗑️ Intentando eliminar cliente ${id} por usuario ${user.email}`);

    // Verificar permisos
    if (!canDeleteClients(user)) {
      throw new AppError('No tienes permisos para eliminar clientes', 403);
    }

    // Obtener información del cliente
    const client = await queryOne<any>(`
      SELECT c.*, u.email as userEmail 
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `, [id]);

    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    console.log(`📋 Cliente encontrado: ${client.firstName} ${client.lastName} (${client.userEmail})`);

    // Verificar si el usuario puede eliminar este cliente específico
    // Master puede eliminar cualquier cliente
    // Admin solo puede eliminar clientes de su empresa
    if (!user.isMaster) {
      if (!user.currentCompanyId) {
        throw new AppError('No se puede determinar la empresa del usuario', 400);
      }
      
      if (client.companyId !== user.currentCompanyId) {
        throw new AppError('No tienes permisos para eliminar este cliente', 403);
      }
    }

    // Verificar si tiene citas pendientes o confirmadas
    const pendingAppointments = await queryOne<any>(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE clientId = ? 
      AND status IN ('PENDING', 'CONFIRMED')
    `, [id]);

    if (pendingAppointments && pendingAppointments.count > 0) {
      throw new AppError(
        `No se puede eliminar el cliente. Tiene ${pendingAppointments.count} cita(s) pendiente(s) o confirmada(s). Por favor, cancele o complete las citas antes de eliminar.`,
        400
      );
    }

    // Verificar si tiene facturas pendientes
    const pendingInvoices = await queryOne<any>(`
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE clientId = ? 
      AND status IN ('PENDING', 'OVERDUE')
    `, [id]);

    if (pendingInvoices && pendingInvoices.count > 0) {
      throw new AppError(
        `No se puede eliminar el cliente. Tiene ${pendingInvoices.count} factura(s) pendiente(s). Por favor, liquide las facturas antes de eliminar.`,
        400
      );
    }

    // Verificar si tiene citas completadas (advertencia informativa)
    const completedAppointments = await queryOne<any>(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE clientId = ? 
      AND status = 'COMPLETED'
    `, [id]);

    console.log(`⚠️ Eliminando cliente con ${completedAppointments?.count || 0} cita(s) completada(s)`);

    // Iniciar eliminación en orden correcto para evitar errores de FK
    try {
      console.log(`🗑️ Iniciando eliminación del cliente ${id}`);

      // 1. Eliminar registros médicos del cliente (si la tabla existe)
      try {
        const medicalRecordsResult = await query(`DELETE FROM medical_records WHERE clientId = ?`, [id]) as any;
        console.log(`✅ ${(medicalRecordsResult as any)?.affectedRows || 0} registros médicos eliminados`);
      } catch (err: any) {
        console.log(`⚠️ No se pudieron eliminar registros médicos: ${err.message}`);
      }

      // 2. Eliminar tratamientos de citas del cliente
      try {
        const treatmentsResult = await query(`
          DELETE at FROM appointment_treatments at
          INNER JOIN appointments a ON at.appointmentId = a.id
          WHERE a.clientId = ?
        `, [id]) as any;
        console.log(`✅ ${(treatmentsResult as any)?.affectedRows || 0} tratamientos de citas eliminados`);
      } catch (err: any) {
        console.log(`⚠️ No se pudieron eliminar tratamientos de citas: ${err.message}`);
      }

      // 3. Eliminar citas del cliente (completadas, canceladas, etc.)
      const appointmentsResult = await query(`DELETE FROM appointments WHERE clientId = ?`, [id]) as any;
      console.log(`✅ ${(appointmentsResult as any)?.affectedRows || 0} citas eliminadas`);

      // 4. Eliminar facturas del cliente (si la tabla existe)
      try {
        const invoicesResult = await query(`DELETE FROM invoices WHERE clientId = ?`, [id]) as any;
        console.log(`✅ ${(invoicesResult as any)?.affectedRows || 0} facturas eliminadas`);
      } catch (err: any) {
        console.log(`⚠️ No se pudieron eliminar facturas: ${err.message}`);
      }

      // 5. Eliminar relación usuario-empresa
      const userCompaniesResult = await query(`DELETE FROM user_companies WHERE userId = ?`, [client.userId]) as any;
      console.log(`✅ ${(userCompaniesResult as any)?.affectedRows || 0} relaciones usuario-empresa eliminadas`);

      // 6. Eliminar registro del cliente
      const clientResult = await query(`DELETE FROM clients WHERE id = ?`, [id]) as any;
      console.log(`✅ Cliente eliminado (${(clientResult as any)?.affectedRows || 0} registros)`);

      // 7. Eliminar usuario asociado
      const userResult = await query(`DELETE FROM users WHERE id = ?`, [client.userId]) as any;
      console.log(`✅ Usuario eliminado (${(userResult as any)?.affectedRows || 0} registros)`);

      console.log('🎉 Cliente eliminado completamente');

      const response: ApiResponse = {
        success: true,
        message: 'Cliente y todos sus datos relacionados eliminados exitosamente'
      };

      res.json(response);
    } catch (deleteError: any) {
      console.error('❌ Error al eliminar cliente:', deleteError);
      console.error('❌ Stack trace:', deleteError.stack);
      throw new AppError(`Error al eliminar el cliente: ${deleteError.message}`, 500);
    }
  } catch (error) {
    console.error('❌ Error general en deleteClient:', error);
    next(error);
  }
};

export const getClientAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const appointments = await query<any>(`
      SELECT 
        a.*,
        e.position as employeePosition,
        u.firstName as employeeFirstName,
        u.lastName as employeeLastName,
        GROUP_CONCAT(
          CONCAT(t.name, ' (', at.quantity, ')')
          SEPARATOR ', '
        ) as treatments
      FROM appointments a
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN users u ON e.userId = u.id
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      WHERE a.clientId = ?
      GROUP BY a.id
      ORDER BY a.date DESC, a.startTime DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    const total = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total FROM appointments WHERE clientId = ?
    `, [id]);

    const response: PaginatedResponse = {
      success: true,
      data: appointments,
      pagination: {
        page,
        limit,
        total: total?.total || 0,
        totalPages: Math.ceil((total?.total || 0) / limit)
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
