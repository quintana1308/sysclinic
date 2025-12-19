import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse, AppointmentStatus } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/auth';
import { generateInvoiceFromAppointment } from './invoice.controller';
import { createMedicalHistoryFromAppointment } from './medicalHistory.controller';

export const getAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const employeeId = req.query.employeeId as string;
    let clientId = req.query.clientId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtrar por empresa (obligatorio para usuarios no master)
    if (!req.user?.isMaster) {
      if (!req.user?.companies?.current?.id) {
        throw new AppError('Usuario no tiene empresa asignada', 403);
      }
      whereClause += ` AND a.companyId = ?`;
      params.push(req.user.companies.current.id);
    } else if (req.companyId) {
      // Si el master ha seleccionado una empresa específica
      whereClause += ` AND a.companyId = ?`;
      params.push(req.companyId);
    }

    // DEBUG: Verificar roles del usuario
    console.log(`🔍 Roles del usuario:`, req.user?.roles);
    console.log(`🔍 Tipo de roles:`, req.user?.roles?.map((role: any) => typeof role));
    
    const isClient = req.user?.roles?.some((role: any) => {
      // Manejar diferentes estructuras de roles
      let roleName = '';
      
      if (typeof role === 'string') {
        roleName = role.toLowerCase();
      } else if (role.name) {
        roleName = role.name.toLowerCase();
      } else if (role.role && role.role.name) {
        // Estructura anidada: { role: { name: 'cliente' } }
        roleName = role.role.name.toLowerCase();
      }
      
      return roleName === 'cliente' || roleName === 'client';
    });
    
    console.log(`🔍 ¿Es usuario cliente?`, isClient);
    
    // Filtrar por cliente si el usuario es cliente (solo puede ver sus propias citas)
    // EXCEPCIÓN: Para validación de horarios (cuando se solicitan citas por fecha), 
    // los clientes necesitan ver TODAS las citas para validar disponibilidad
    const isDateRangeQuery = startDate && endDate && startDate === endDate && !search && !status && !employeeId && !clientId;
    
    if (isClient && !isDateRangeQuery) {
      console.log(`🔍 Usuario cliente detectado: ${req.user.id}`);
      console.log(`🔍 Buscando registro de cliente en tabla clients para userId: ${req.user.id}`);
      
      // Buscar el clientId real basado en el userId
      const clientRecord = await queryOne<{ id: string }>(`
        SELECT id FROM clients WHERE userId = ? AND companyId = ?
      `, [req.user.id, req.user?.companies?.current?.id || req.companyId]);
      
      console.log(`� Resultado de búsqueda de cliente:`, clientRecord);
      
      if (clientRecord) {
        // Usar el clientId real de la tabla clients
        whereClause += ` AND a.clientId = ?`;
        params.push(clientRecord.id);
        console.log(`✅ Filtrando citas por clientId real: ${clientRecord.id} (usuario: ${req.user.id})`);
        
        // Sobrescribir el clientId del parámetro con el clientId real
        clientId = clientRecord.id;
      } else {
        // Si no se encuentra el registro de cliente, no mostrar citas
        console.log(`❌ No se encontró registro de cliente para usuario: ${req.user.id}`);
        console.log(`❌ El usuario no tiene un registro correspondiente en la tabla clients`);
        whereClause += ` AND 1=0`; // Condición que nunca se cumple
      }
    } else if (isClient && isDateRangeQuery) {
      console.log(`🔍 Cliente solicitando citas para validación de horarios - mostrando TODAS las citas de la fecha`);
      console.log(`📅 Fecha solicitada: ${startDate} (para validación de disponibilidad)`);
      // No aplicar filtro por clientId para permitir validación de horarios ocupados
    }

    if (search) {
      whereClause += ` AND (uc.firstName LIKE ? OR uc.lastName LIKE ? OR uc.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ` AND a.status = ?`;
      params.push(status);
    }

    if (employeeId) {
      whereClause += ` AND a.employeeId = ?`;
      params.push(employeeId);
    }

    // Para usuarios no cliente, aplicar filtro por clientId del parámetro
    if (clientId && !isClient) {
      console.log(`🔍 Aplicando filtro por clientId para usuario no-cliente: ${clientId}`);
      whereClause += ` AND a.clientId = ?`;
      params.push(clientId);
    } else if (clientId && isClient) {
      console.log(`⚠️ Usuario es cliente, pero se recibió clientId en parámetro: ${clientId}`);
      console.log(`⚠️ Esto puede indicar un problema en el frontend`);
    }

    if (startDate) {
      whereClause += ` AND DATE(a.date) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND DATE(a.date) <= ?`;
      params.push(endDate);
    }

    console.log(`🔍 WHERE CLAUSE FINAL: ${whereClause}`);
    console.log(`🔍 PARÁMETROS FINALES:`, params);

    // DIAGNÓSTICO: Verificar si existe el registro del cliente
    if (clientId) {
      const clientExists = await queryOne<{ client_count: number }>(`
        SELECT COUNT(*) as client_count FROM clients WHERE id = ?
      `, [clientId]);
      console.log(`🔍 ¿Existe cliente con id ${clientId}?`, (clientExists?.client_count || 0) > 0 ? 'SÍ' : 'NO');
      
      // Verificar si existen citas para este clientId sin INNER JOIN
      const appointmentsForClient = await queryOne<{ count: number }>(`
        SELECT COUNT(*) as count FROM appointments WHERE clientId = ? AND companyId = ?
      `, [clientId, req.user?.companies?.current?.id || req.companyId]);
      console.log(`🔍 Citas directas para clientId ${clientId}:`, appointmentsForClient?.count || 0);
      
      // Mostrar algunos registros de ejemplo de la tabla clients
      const sampleClients = await query<any>(`
        SELECT id, userId, clientCode FROM clients WHERE companyId = ? LIMIT 3
      `, [req.user?.companies?.current?.id || req.companyId]);
      console.log(`🔍 Ejemplos de registros en tabla clients:`, sampleClients);
      
      // Mostrar algunos registros de ejemplo de la tabla appointments
      const sampleAppointments = await query<any>(`
        SELECT id, clientId, date FROM appointments WHERE companyId = ? LIMIT 3
      `, [req.user?.companies?.current?.id || req.companyId]);
      console.log(`🔍 Ejemplos de registros en tabla appointments:`, sampleAppointments);
    }

    // Obtener total de registros
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN users ue ON a.employeeId = ue.id
      ${whereClause}
    `;
    
    console.log(`🔍 CONSULTA DE CONTEO:`, totalQuery);
    const totalResult = await queryOne<{ total: number }>(totalQuery, params);

    const total = totalResult?.total || 0;
    console.log(`📊 Total de registros encontrados: ${total}`);

    // Consulta para obtener citas (SIN LIMIT/OFFSET para Railway MySQL)
    const mainQuery = `
      SELECT 
        a.*,
        c.clientCode,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.email as clientEmail,
        uc.phone as clientPhone,
        ue.firstName as employeeFirstName,
        ue.lastName as employeeLastName,
        ue.email as employeeEmail,
        e.position as employeePosition,
        CASE 
          WHEN e.id IS NOT NULL THEN 'employee'
          WHEN ucomp.role = 'admin' THEN 'admin'
          ELSE NULL
        END as employeeType
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN users ue ON a.employeeId = ue.id
      LEFT JOIN employees e ON a.employeeId = e.userId
      LEFT JOIN user_companies ucomp ON a.employeeId = ucomp.userId AND ucomp.role = 'admin'
      ${whereClause}
      ORDER BY a.date DESC, a.startTime DESC
    `;
    
    console.log(`🔍 CONSULTA PRINCIPAL:`, mainQuery);
    const allAppointments = await query<any>(mainQuery, params);

    console.log(`📊 Citas encontradas: ${allAppointments.length}`);
    console.log(`📊 Parámetros utilizados:`, params);

    // Aplicar paginación manual (compatible con Railway MySQL)
    // EXCEPCIÓN: Para validación de horarios, devolver TODAS las citas sin paginación
    let appointments;
    if (isDateRangeQuery) {
      console.log(`🔍 Consulta de validación de horarios - devolviendo TODAS las ${allAppointments.length} citas sin paginación`);
      appointments = allAppointments; // Todas las citas para validación
    } else {
      appointments = allAppointments.slice(offset, offset + limit); // Paginación normal
    }

    // Obtener tratamientos para cada cita y mapear datos del cliente
    for (const appointment of appointments) {
      try {
        const treatments = await query<any>(`
          SELECT 
            t.id,
            t.name,
            t.description,
            t.duration,
            at.price,
            at.quantity
          FROM appointment_treatments at
          INNER JOIN treatments t ON at.treatmentId = t.id
          WHERE at.appointmentId = ?
        `, [appointment.id]);

        appointment.treatments = treatments || [];
        
        // Mapear datos del cliente a objeto anidado
        appointment.client = {
          firstName: appointment.clientFirstName,
          lastName: appointment.clientLastName,
          email: appointment.clientEmail,
          phone: appointment.clientPhone,
          clientCode: appointment.clientCode
        };
        
        // Mapear datos del empleado a objeto anidado si existe
        if (appointment.employeeFirstName) {
          appointment.employee = {
            firstName: appointment.employeeFirstName,
            lastName: appointment.employeeLastName,
            email: appointment.employeeEmail,
            position: appointment.employeePosition
          };
        }
        
        console.log(`📋 Cita ${appointment.id}: ${treatments.length} tratamientos encontrados`);
      } catch (treatmentError) {
        console.error(`❌ Error obteniendo tratamientos para cita ${appointment.id}:`, treatmentError);
        appointment.treatments = [];
      }
    }

    const response: PaginatedResponse = {
      success: true,
      data: appointments,
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

export const getAppointmentById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const appointment = await queryOne<any>(`
      SELECT 
        a.*,
        c.clientCode,
        c.dateOfBirth,
        c.gender,
        c.address,
        c.emergencyContact,
        c.medicalConditions,
        c.allergies,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.email as clientEmail,
        uc.phone as clientPhone,
        ue.firstName as employeeFirstName,
        ue.lastName as employeeLastName,
        ue.email as employeeEmail,
        e.position as employeePosition,
        CASE 
          WHEN e.id IS NOT NULL THEN 'employee'
          WHEN ucomp.role = 'admin' THEN 'admin'
          ELSE NULL
        END as employeeType
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN users ue ON a.employeeId = ue.id
      LEFT JOIN employees e ON a.employeeId = e.userId
      LEFT JOIN user_companies ucomp ON a.employeeId = ucomp.userId AND ucomp.role = 'admin'
      WHERE a.id = ?
    `, [id]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    // Obtener tratamientos de la cita
    const treatments = await query<any>(`
      SELECT 
        at.*,
        t.name,
        t.description,
        t.duration,
        t.category
      FROM appointment_treatments at
      INNER JOIN treatments t ON at.treatmentId = t.id
      WHERE at.appointmentId = ?
    `, [id]);

    // Obtener pagos relacionados
    const payments = await query<any>(`
      SELECT * FROM payments WHERE appointmentId = ?
      ORDER BY createdAt DESC
    `, [id]);

    // Mapear datos del cliente y empleado a objetos anidados
    const mappedAppointment = {
      ...appointment,
      client: {
        firstName: appointment.clientFirstName,
        lastName: appointment.clientLastName,
        email: appointment.clientEmail,
        phone: appointment.clientPhone,
        clientCode: appointment.clientCode,
        dateOfBirth: appointment.dateOfBirth,
        gender: appointment.gender,
        address: appointment.address,
        emergencyContact: appointment.emergencyContact,
        medicalConditions: appointment.medicalConditions,
        allergies: appointment.allergies
      },
      employee: appointment.employeeFirstName ? {
        firstName: appointment.employeeFirstName,
        lastName: appointment.employeeLastName,
        email: appointment.employeeEmail,
        position: appointment.employeePosition
      } : null,
      treatments,
      payments
    };

    const response: ApiResponse = {
      success: true,
      message: 'Cita obtenida exitosamente',
      data: mappedAppointment
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clientId,
      employeeId,
      date,
      startTime,
      endTime,
      treatments,
      notes
    } = req.body;

    if (!clientId || !date || !startTime || !endTime || !treatments || treatments.length === 0) {
      throw new AppError('Cliente, fecha, hora y tratamientos son requeridos', 400);
    }

    // Obtener empresa actual
    let companyId = req.user?.companies?.current?.id;
    
    // Si es usuario master y ha seleccionado una empresa específica
    if (req.user?.isMaster && req.companyId) {
      companyId = req.companyId;
    }
    
    // Si es usuario master y no hay empresa seleccionada, usar la primera disponible
    if (req.user?.isMaster && !companyId) {
      // Para usuarios master, obtener la primera empresa disponible
      const firstCompany = await queryOne<any>(`
        SELECT id FROM companies ORDER BY createdAt ASC LIMIT 1
      `);
      companyId = firstCompany?.id;
    }

    if (!companyId) {
      throw new AppError('No se puede determinar la empresa para la cita', 400);
    }

    // Validar que la fecha no sea en el pasado
    const appointmentDateTime = new Date(`${date}T${startTime}`);
    const now = new Date();
    
    if (appointmentDateTime < now) {
      throw new AppError('No se pueden crear citas en el pasado', 400);
    }

    // Validar que endTime sea después de startTime
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);
    
    if (endDateTime <= startDateTime) {
      throw new AppError('La hora de fin debe ser posterior a la hora de inicio', 400);
    }

    // Verificar que el cliente existe y pertenece a la empresa
    console.log('Validating client:', { clientId, companyId, userRoles: req.user?.roles });
    
    // Detectar si el usuario actual es un cliente creando su propia cita
    const userRoles = req.user?.roles || [];
    const isClientUser = userRoles.some((role: any) => 
      (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'cliente' ||
      (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'client'
    );
    
    let client;
    
    // Intentar buscar primero por clientId (c.id), si no encuentra, buscar por userId (c.userId)
    console.log('Buscando cliente por clientId:', clientId);
    client = await queryOne(`
      SELECT 
        c.id,
        c.userId,
        c.clientCode,
        c.companyId,
        u.firstName,
        u.lastName,
        u.email
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
      WHERE c.id = ?
    `, [clientId]);
    
    if (!client) {
      // Si no se encontró por clientId, intentar buscar por userId
      console.log('No encontrado por clientId, buscando por userId:', clientId);
      client = await queryOne(`
        SELECT 
          c.id,
          c.userId,
          c.clientCode,
          c.companyId,
          u.firstName,
          u.lastName,
          u.email
        FROM clients c
        INNER JOIN users u ON c.userId = u.id
        WHERE c.userId = ?
      `, [clientId]);
      
      if (client) {
        console.log('Cliente encontrado por userId (compatibilidad)');
      }
    } else {
      console.log('Cliente encontrado por clientId (método preferido)');
    }
    
    console.log('Client found:', client);
    
    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }
    
    // Si es un cliente creando su propia cita, usar el clientId real de la tabla clients
    const actualClientId = client.id;
    
    // Verificar si el cliente pertenece a la empresa (según estructura real)
    if (!req.user?.isMaster && client.companyId !== companyId) {
      throw new AppError('Cliente no pertenece a tu empresa', 403);
    }

    // Verificar que el encargado (empleado o administrador) existe y pertenece a la empresa
    let validatedUserId = null; // El userId del encargado (admin o empleado)
    
    if (employeeId) {
      console.log('Validating encargado:', { employeeId, companyId });
      
      // Primero buscar como usuario con rol admin (employeeId es userId)
      let encargado = await queryOne(`
        SELECT u.id, uc.companyId, u.id as userId, 'admin' as type
        FROM users u
        INNER JOIN user_companies uc ON u.id = uc.userId
        WHERE u.id = ? AND u.isActive = 1 AND uc.role = 'admin' AND uc.isActive = 1
      `, [employeeId]);
      
      // Si no es admin, buscar como empleado por userId
      if (!encargado) {
        encargado = await queryOne(`
          SELECT e.id, e.companyId, e.userId, 'employee' as type
          FROM employees e 
          WHERE e.userId = ? AND e.isActive = 1
        `, [employeeId]);
      }
      
      console.log('Encargado found:', encargado);
      
      if (!encargado) {
        throw new AppError('Encargado no encontrado o inactivo', 404);
      }
      
      // Verificar empresa (más flexible para usuarios master)
      if (!req.user?.isMaster && encargado.companyId !== companyId) {
        throw new AppError('Encargado no pertenece a tu empresa', 403);
      }
      
      // Guardar el userId para usar en la cita (tanto admin como empleado)
      validatedUserId = encargado.userId || encargado.id;
      
      console.log('✅ Encargado validado:', {
        id: encargado.id,
        userId: encargado.userId,
        type: encargado.type,
        companyId: encargado.companyId,
        validatedUserId
      });
    }

    // Verificar disponibilidad del encargado (admin o empleado)
    if (validatedUserId) {
      const startDateTimeStr = `${date} ${startTime}`;
      const endDateTimeStr = `${date} ${endTime}`;
      
      const conflictingAppointment = await queryOne<any>(`
        SELECT id FROM appointments 
        WHERE employeeId = ? 
        AND date = ? 
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND (
          (startTime <= ? AND endTime > ?) OR
          (startTime < ? AND endTime >= ?) OR
          (startTime >= ? AND endTime <= ?)
        )
      `, [validatedUserId, date, startDateTimeStr, startDateTimeStr, endDateTimeStr, endDateTimeStr, startDateTimeStr, endDateTimeStr]);

      if (conflictingAppointment) {
        throw new AppError('El encargado ya tiene una cita en ese horario', 400);
      }
    }

    // Calcular total de la cita
    let totalAmount = 0;
    for (const treatment of treatments) {
      console.log('Validating treatment:', { treatmentId: treatment.treatmentId, companyId });
      
      const treatmentData = await queryOne<any>(`
        SELECT price, companyId FROM treatments WHERE id = ? AND isActive = 1
      `, [treatment.treatmentId]);
      
      console.log('Treatment found:', treatmentData);
      
      if (!treatmentData) {
        throw new AppError(`Tratamiento ${treatment.treatmentId} no encontrado o inactivo`, 400);
      }
      
      // Verificar empresa (más flexible para usuarios master)
      if (!req.user?.isMaster && treatmentData.companyId !== companyId) {
        throw new AppError(`Tratamiento ${treatment.treatmentId} no pertenece a tu empresa`, 400);
      }
      
      totalAmount += treatmentData.price * (treatment.quantity || 1);
    }

    // Crear la cita
    const appointmentId = generateId();
    
    // Formatear startTime y endTime para MySQL
    let formattedStartTime = startTime;
    let formattedEndTime = endTime;
    
    // Si startTime es solo hora (formato del panel admin), combinar con la fecha
    if (startTime && startTime.length <= 8 && !startTime.includes(' ') && !startTime.includes('T')) {
      formattedStartTime = `${date} ${startTime}:00`;
      console.log('Formato admin detectado - startTime:', formattedStartTime);
    }
    
    // Si endTime es solo hora (formato del panel admin), combinar con la fecha
    if (endTime && endTime.length <= 8 && !endTime.includes(' ') && !endTime.includes('T')) {
      formattedEndTime = `${date} ${endTime}:00`;
      console.log('Formato admin detectado - endTime:', formattedEndTime);
    }
    
    console.log('Datos finales para inserción:', {
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      date,
      clientId: actualClientId
    });
    
    await query(`
      INSERT INTO appointments (
        id, companyId, clientId, employeeId, date, startTime, endTime, 
        status, notes, totalAmount, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?, NOW(), NOW())
    `, [
      appointmentId, companyId, actualClientId, validatedUserId, date, 
      formattedStartTime, formattedEndTime, 
      notes || null, totalAmount
    ]);

    // Agregar tratamientos
    for (const treatment of treatments) {
      const treatmentData = await queryOne<any>(`
        SELECT price FROM treatments WHERE id = ?
      `, [treatment.treatmentId]);

      await query(`
        INSERT INTO appointment_treatments (
          id, appointmentId, treatmentId, quantity, price, notes
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        generateId(), appointmentId, treatment.treatmentId,
        treatment.quantity || 1, treatmentData.price, treatment.notes || null
      ]);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Cita creada exitosamente',
      data: {
        id: appointmentId,
        totalAmount,
        status: 'SCHEDULED'
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      employeeId,
      date,
      startTime,
      endTime,
      treatments,
      notes
    } = req.body;

    // Verificar que la cita existe
    const appointment = await queryOne<any>(`
      SELECT * FROM appointments WHERE id = ?
    `, [id]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    // No permitir modificar citas completadas o canceladas
    if (appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED') {
      throw new AppError('No se puede modificar una cita completada o cancelada', 400);
    }

    // Nota: No validamos fecha pasada en edición para permitir correcciones administrativas

    // Verificar que el encargado existe si se especifica
    let validatedUserId = undefined; // El userId del encargado (admin o empleado)
    
    if (employeeId) {
      console.log('Validating encargado for update:', { employeeId });
      
      // Primero buscar como usuario con rol admin (employeeId es userId)
      let encargado = await queryOne(`
        SELECT u.id, uc.companyId, u.id as userId, 'admin' as type
        FROM users u
        INNER JOIN user_companies uc ON u.id = uc.userId
        WHERE u.id = ? AND u.isActive = 1 AND uc.role = 'admin' AND uc.isActive = 1
      `, [employeeId]);
      
      // Si no es admin, buscar como empleado por userId
      if (!encargado) {
        encargado = await queryOne(`
          SELECT e.id, e.companyId, e.userId, 'employee' as type
          FROM employees e 
          WHERE e.userId = ? AND e.isActive = 1
        `, [employeeId]);
      }
      
      console.log('Encargado found for update:', encargado);
      
      if (!encargado) {
        throw new AppError('Encargado no encontrado o inactivo', 404);
      }
      
      // Guardar el userId para usar en la cita (tanto admin como empleado)
      validatedUserId = encargado.userId || encargado.id;
    }

    // Verificar disponibilidad del encargado si se cambia
    if (validatedUserId && (date || startTime || endTime)) {
      const checkDate = date || appointment.date.toISOString().split('T')[0];
      const checkStartTime = startTime || appointment.startTime.toTimeString().slice(0, 5);
      const checkEndTime = endTime || appointment.endTime.toTimeString().slice(0, 5);

      const conflictingAppointment = await queryOne<any>(`
        SELECT id FROM appointments 
        WHERE employeeId = ? 
        AND id != ?
        AND date = ? 
        AND status NOT IN ('CANCELLED', 'NO_SHOW')
        AND (
          (startTime <= ? AND endTime > ?) OR
          (startTime < ? AND endTime >= ?) OR
          (startTime >= ? AND endTime <= ?)
        )
      `, [validatedUserId, id, checkDate, checkStartTime, checkStartTime, checkEndTime, checkEndTime, checkStartTime, checkEndTime]);

      if (conflictingAppointment) {
        throw new AppError('El encargado ya tiene una cita en ese horario', 400);
      }
    }

    let totalAmount = appointment.totalAmount;

    // Actualizar tratamientos si se proporcionan
    if (treatments && treatments.length > 0) {
      // Eliminar tratamientos existentes
      await query(`DELETE FROM appointment_treatments WHERE appointmentId = ?`, [id]);

      // Recalcular total
      totalAmount = 0;
      
      // Agregar nuevos tratamientos
      for (const treatment of treatments) {
        const treatmentData = await queryOne<any>(`
          SELECT price FROM treatments WHERE id = ? AND isActive = 1
        `, [treatment.treatmentId]);
        
        if (!treatmentData) {
          throw new AppError(`Tratamiento ${treatment.treatmentId} no encontrado o inactivo`, 400);
        }
        
        totalAmount += treatmentData.price * (treatment.quantity || 1);

        await query(`
          INSERT INTO appointment_treatments (
            id, appointmentId, treatmentId, quantity, price, notes
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          generateId(), id, treatment.treatmentId,
          treatment.quantity || 1, treatmentData.price, treatment.notes || null
        ]);
      }
    }

    // Preparar valores de fecha y hora para MySQL
    const updateDate = date || appointment.date;
    const updateStartTime = startTime ? `${date || appointment.date.toISOString().split('T')[0]} ${startTime}:00` : appointment.startTime;
    const updateEndTime = endTime ? `${date || appointment.date.toISOString().split('T')[0]} ${endTime}:00` : appointment.endTime;

    console.log('📅 Valores de actualización preparados:', {
      updateDate,
      updateStartTime,
      updateEndTime,
      originalStartTime: appointment.startTime,
      originalEndTime: appointment.endTime
    });

    // Actualizar la cita
    await query(`
      UPDATE appointments 
      SET employeeId = ?, date = ?, startTime = ?, endTime = ?, 
          notes = ?, totalAmount = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      validatedUserId !== undefined ? validatedUserId : appointment.employeeId,
      updateDate,
      updateStartTime,
      updateEndTime,
      notes !== undefined ? notes : appointment.notes,
      totalAmount,
      id
    ]);

    // Actualizar factura asociada si existe y si se modificaron los tratamientos
    if (treatments && treatments.length > 0) {
      console.log('🔄 Verificando si existe factura asociada para actualizar...');
      
      const existingInvoice = await queryOne<any>(`
        SELECT id, amount, subtotal, discountType, discountValue FROM invoices WHERE appointmentId = ?
      `, [id]);

      if (existingInvoice) {
        console.log('📄 Factura encontrada, actualizando monto...', {
          invoiceId: existingInvoice.id,
          oldAmount: existingInvoice.amount,
          newTotalAmount: totalAmount
        });

        // Si la factura tiene descuento aplicado, mantener el descuento pero actualizar el subtotal
        if (existingInvoice.discountValue && existingInvoice.discountValue > 0) {
          console.log('💰 Factura tiene descuento aplicado, recalculando...');
          
          let newDiscountAmount = 0;
          if (existingInvoice.discountType === 'PERCENTAGE') {
            newDiscountAmount = (totalAmount * existingInvoice.discountValue) / 100;
          } else {
            newDiscountAmount = existingInvoice.discountValue;
          }
          
          const newFinalAmount = totalAmount - newDiscountAmount;
          
          console.log('🧮 Recálculo con descuento:', {
            newSubtotal: totalAmount,
            discountType: existingInvoice.discountType,
            discountValue: existingInvoice.discountValue,
            discountAmount: newDiscountAmount,
            newFinalAmount: newFinalAmount
          });

          await query(`
            UPDATE invoices 
            SET subtotal = ?, amount = ?, updatedAt = NOW()
            WHERE id = ?
          `, [totalAmount, newFinalAmount, existingInvoice.id]);
        } else {
          // Sin descuento, actualizar directamente
          console.log('📝 Actualizando factura sin descuento...');
          
          await query(`
            UPDATE invoices 
            SET amount = ?, subtotal = ?, updatedAt = NOW()
            WHERE id = ?
          `, [totalAmount, totalAmount, existingInvoice.id]);
        }

        console.log('✅ Factura actualizada exitosamente');
      } else {
        console.log('ℹ️ No hay factura asociada a esta cita');
      }
    }

    const response: ApiResponse = {
      success: true,
      message: 'Cita actualizada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔄 Actualizando estado de cita:', { id, status });

    // Validar que el estado sea válido
    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Estado de cita inválido', 400);
    }

    // Verificar que la cita existe
    const appointment = await queryOne<any>(`
      SELECT * FROM appointments WHERE id = ?
    `, [id]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    console.log('📋 Cita encontrada:', { 
      id: appointment.id, 
      currentStatus: appointment.status, 
      newStatus: status 
    });

    console.log('🔍 Verificando condición para generar factura:');
    console.log('   - Nuevo estado:', status);
    console.log('   - Estado actual:', appointment.status);
    console.log('   - ¿Es COMPLETED?:', status === 'COMPLETED');
    console.log('   - ¿No era COMPLETED antes?:', appointment.status !== 'COMPLETED');
    console.log('   - ¿Debe generar factura?:', status === 'COMPLETED' && appointment.status !== 'COMPLETED');

    // Actualizar el estado
    await query(`
      UPDATE appointments 
      SET status = ?, updatedAt = NOW()
      WHERE id = ?
    `, [status, id]);

    let invoiceId = null;

    // Si el estado cambia a CONFIRMED o COMPLETED, generar factura automáticamente
    if ((status === 'CONFIRMED' || status === 'COMPLETED') && 
        (appointment.status !== 'CONFIRMED' && appointment.status !== 'COMPLETED')) {
      console.log('💰 ¡CONDICIÓN CUMPLIDA! Cita confirmada/completada - generando factura automáticamente...');
      
      try {
        console.log('🔍 Paso 1: Obteniendo información de la cita con tratamientos...');
        
        // Obtener información de la cita con tratamientos para generar factura
        const appointmentWithTreatments = await queryOne<any>(`
          SELECT 
            a.*,
            uc.firstName as clientFirstName,
            uc.lastName as clientLastName,
            GROUP_CONCAT(t.name SEPARATOR ', ') as treatmentNames,
            SUM(at.price * at.quantity) as totalAmount
          FROM appointments a
          INNER JOIN clients c ON a.clientId = c.id
          INNER JOIN users uc ON c.userId = uc.id
          LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
          LEFT JOIN treatments t ON at.treatmentId = t.id
          WHERE a.id = ?
          GROUP BY a.id
        `, [id]);

        console.log('📋 Datos de cita obtenidos:', {
          found: !!appointmentWithTreatments,
          clientId: appointmentWithTreatments?.clientId,
          clientName: appointmentWithTreatments ? `${appointmentWithTreatments.clientFirstName} ${appointmentWithTreatments.clientLastName}` : 'N/A',
          treatmentNames: appointmentWithTreatments?.treatmentNames,
          totalAmount: appointmentWithTreatments?.totalAmount
        });

        if (appointmentWithTreatments) {
          console.log('🔍 Paso 2: Verificando si ya existe factura...');
          
          // Verificar si ya existe una factura para esta cita
          const existingInvoice = await queryOne(`
            SELECT id FROM invoices WHERE appointmentId = ?
          `, [id]);

          console.log('📄 Factura existente:', existingInvoice ? existingInvoice.id : 'No existe');

          if (!existingInvoice) {
            console.log('🔍 Paso 3: Creando nueva factura...');
            
            const newInvoiceId = generateId();
            
            // Asegurar que el monto sea un número válido
            let amount = 0;
            if (appointmentWithTreatments.totalAmount && !isNaN(parseFloat(appointmentWithTreatments.totalAmount))) {
              amount = parseFloat(appointmentWithTreatments.totalAmount);
            }
            
            console.log('💰 Monto calculado para la factura:', amount, 'desde totalAmount:', appointmentWithTreatments.totalAmount);
            
            const clientName = `${appointmentWithTreatments.clientFirstName} ${appointmentWithTreatments.clientLastName}`;
            const description = `Factura por ${appointmentWithTreatments.treatmentNames || 'Tratamientos'} - ${clientName}`;
            
            // Calcular fecha de vencimiento (30 días después de la cita)
            const appointmentDate = new Date(appointmentWithTreatments.date);
            const dueDate = new Date(appointmentDate);
            dueDate.setDate(dueDate.getDate() + 30);

            console.log('📝 Datos de factura a insertar:', {
              id: newInvoiceId,
              clientId: appointmentWithTreatments.clientId,
              appointmentId: id,
              amount: amount,
              description: description,
              dueDate: dueDate.toISOString().split('T')[0]
            });

            await query(`
              INSERT INTO invoices (
                id, clientId, appointmentId, amount, subtotal, description, dueDate, status, createdAt, updatedAt
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())
            `, [
              newInvoiceId, 
              appointmentWithTreatments.clientId, 
              id, 
              amount, 
              amount,
              description, 
              dueDate.toISOString().split('T')[0]
            ]);

            invoiceId = newInvoiceId;
            console.log('✅ ¡FACTURA GENERADA EXITOSAMENTE!:', invoiceId);
          } else {
            invoiceId = existingInvoice.id;
            console.log('ℹ️ Ya existe factura para esta cita:', invoiceId);
          }
        } else {
          console.log('❌ No se pudo obtener información de la cita con tratamientos');
        }
      } catch (invoiceError: any) {
        console.error('❌ ERROR CRÍTICO al generar factura:', invoiceError);
        console.error('📋 Stack trace completo:', invoiceError.stack);
        console.error('📋 Mensaje de error:', invoiceError.message);
        console.error('📋 SQL Error Code:', invoiceError.code);
        // No fallar la actualización del estado si hay error en la factura
        console.log('⚠️ Continuando con actualización de estado sin factura');
      }
    } else {
      console.log('❌ Condición NO cumplida para generar factura');
      console.log('   - Razón: El estado no cambió a CONFIRMED/COMPLETED o ya estaba en uno de esos estados');
      console.log('   - Estado actual:', appointment.status, '-> Nuevo estado:', status);
    }

    // Si el estado cambia a COMPLETED, crear historial médico automáticamente
    let historyId = null;
    if (status === 'COMPLETED' && appointment.status !== 'COMPLETED') {
      console.log('🏥 ¡CONDICIÓN CUMPLIDA! Cita completada - creando historial médico automáticamente...');
      
      try {
        historyId = await createMedicalHistoryFromAppointment(id, req.user?.id || 'system');
        console.log('✅ ¡HISTORIAL MÉDICO CREADO EXITOSAMENTE!:', historyId);
      } catch (historyError: any) {
        console.error('❌ ERROR al crear historial médico:', historyError);
        console.error('📋 Stack trace completo:', historyError.stack);
        // No fallar la actualización del estado si hay error en el historial
        console.log('⚠️ Continuando con actualización de estado sin historial médico');
      }
    }

    const response: ApiResponse = {
      success: true,
      message: `Cita marcada como ${status.toLowerCase()}${invoiceId ? '. Factura generada automáticamente.' : ''}${historyId ? '. Historial médico creado automáticamente.' : ''}`,
      data: { 
        ...(invoiceId && { invoiceId }),
        ...(historyId && { historyId })
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const confirmAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    console.log('🚀 Iniciando confirmación de cita:', id);

    // Verificar que la cita existe
    const appointment = await queryOne<any>(`
      SELECT * FROM appointments WHERE id = ?
    `, [id]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    console.log('📋 Cita encontrada:', appointment);

    // Verificar que el usuario tiene permisos para confirmar esta cita
    if (req.user?.roles?.some((role: any) => 
      (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'cliente' ||
      (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'client'
    )) {
      // Si es cliente, verificar que la cita le pertenece
      const clientRecord = await queryOne<{ id: string }>(`
        SELECT id FROM clients WHERE userId = ?
      `, [req.user.id]);

      if (!clientRecord || appointment.clientId !== clientRecord.id) {
        throw new AppError('No tienes permisos para confirmar esta cita', 403);
      }
      console.log('✅ Cliente autorizado para confirmar su propia cita');
    }

    // Verificar que la cita se puede confirmar
    if (appointment.status === 'CONFIRMED') {
      throw new AppError('La cita ya está confirmada', 400);
    }

    if (appointment.status === 'CANCELLED') {
      throw new AppError('No se puede confirmar una cita cancelada', 400);
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError('No se puede confirmar una cita completada', 400);
    }

    if (appointment.status !== 'SCHEDULED' && appointment.status !== 'RESCHEDULED') {
      throw new AppError('Solo se pueden confirmar citas programadas o reagendadas', 400);
    }

    console.log('✅ Validaciones pasadas, procediendo con la confirmación');

    // Actualizar el estado a confirmado
    await query(`
      UPDATE appointments 
      SET status = 'CONFIRMED', 
          notes = CONCAT(COALESCE(notes, ''), '\n--- CONFIRMADA POR EL CLIENTE ---\nFecha de confirmación: ', NOW()),
          updatedAt = NOW()
      WHERE id = ?
    `, [id]);

    let invoiceId = null;

    // Generar factura automáticamente al confirmar
    console.log('💰 Cita confirmada - generando factura automáticamente...');
    
    try {
      console.log('🔍 Paso 1: Obteniendo información de la cita con tratamientos...');
      
      // Obtener información de la cita con tratamientos para generar factura
      const appointmentWithTreatments = await queryOne<any>(`
        SELECT 
          a.*,
          uc.firstName as clientFirstName,
          uc.lastName as clientLastName,
          GROUP_CONCAT(t.name SEPARATOR ', ') as treatmentNames,
          SUM(at.price * at.quantity) as totalAmount
        FROM appointments a
        INNER JOIN clients c ON a.clientId = c.id
        INNER JOIN users uc ON c.userId = uc.id
        LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
        LEFT JOIN treatments t ON at.treatmentId = t.id
        WHERE a.id = ?
        GROUP BY a.id
      `, [id]);

      console.log('📋 Datos de cita obtenidos:', {
        found: !!appointmentWithTreatments,
        clientId: appointmentWithTreatments?.clientId,
        clientName: appointmentWithTreatments ? `${appointmentWithTreatments.clientFirstName} ${appointmentWithTreatments.clientLastName}` : 'N/A',
        treatmentNames: appointmentWithTreatments?.treatmentNames,
        totalAmount: appointmentWithTreatments?.totalAmount
      });

      if (appointmentWithTreatments) {
        console.log('🔍 Paso 2: Verificando si ya existe factura...');
        
        // Verificar si ya existe una factura para esta cita
        const existingInvoice = await queryOne(`
          SELECT id FROM invoices WHERE appointmentId = ?
        `, [id]);

        console.log('📄 Factura existente:', existingInvoice ? existingInvoice.id : 'No existe');

        if (!existingInvoice) {
          console.log('🔍 Paso 3: Creando nueva factura...');
          
          // Generar número de factura único
          const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          
          // Crear la factura
          const invoiceResult = await query(`
            INSERT INTO invoices (
              invoiceNumber, 
              clientId, 
              appointmentId, 
              amount, 
              status, 
              dueDate, 
              description,
              companyId,
              createdAt,
              updatedAt
            ) VALUES (?, ?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, NOW(), NOW())
          `, [
            invoiceNumber,
            appointmentWithTreatments.clientId,
            id,
            appointmentWithTreatments.totalAmount || 0,
            `Factura por cita médica - ${appointmentWithTreatments.treatmentNames || 'Consulta General'}`,
            appointmentWithTreatments.companyId
          ]) as any;

          invoiceId = invoiceResult.insertId;
          console.log('✅ Factura creada exitosamente:', { invoiceId, invoiceNumber });
        } else {
          invoiceId = existingInvoice.id;
          console.log('ℹ️ Usando factura existente:', invoiceId);
        }
      } else {
        console.log('⚠️ No se pudo obtener información de la cita para generar factura');
      }
    } catch (invoiceError) {
      console.error('❌ Error al generar factura automática:', invoiceError);
      // No fallar la confirmación si hay error en la factura
    }

    console.log('✅ Cita confirmada exitosamente');

    const response: ApiResponse = {
      success: true,
      message: `Cita confirmada exitosamente${invoiceId ? '. Factura generada automáticamente.' : ''}`,
      data: invoiceId ? { invoiceId } : undefined
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error al confirmar cita:', error);
    next(error);
  }
};

export const cancelAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    console.log('🚀 Iniciando cancelación de cita:', id);
    console.log('📝 Motivo:', reason);

    // Verificar que la cita existe
    const appointment = await queryOne<any>(`
      SELECT * FROM appointments WHERE id = ?
    `, [id]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    console.log('📋 Cita encontrada:', appointment);

    // Verificar que el usuario tiene permisos para cancelar esta cita
    if (req.user?.roles?.some((role: any) => 
      (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'cliente' ||
      (typeof role === 'string' ? role.toLowerCase() : role.name?.toLowerCase()) === 'client'
    )) {
      // Si es cliente, verificar que la cita le pertenece
      const clientRecord = await queryOne<{ id: string }>(`
        SELECT id FROM clients WHERE userId = ?
      `, [req.user.id]);

      if (!clientRecord || appointment.clientId !== clientRecord.id) {
        throw new AppError('No tienes permisos para cancelar esta cita', 403);
      }
      console.log('✅ Cliente autorizado para cancelar su propia cita');
    }

    // Verificar que la cita se puede cancelar
    if (appointment.status === 'CANCELLED') {
      throw new AppError('La cita ya está cancelada', 400);
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError('No se puede cancelar una cita completada', 400);
    }

    // Verificar si tiene pagos relacionados (opcional - depende de la lógica de negocio)
    const hasPayments = await queryOne<any>(`
      SELECT COUNT(*) as count FROM payments 
      WHERE appointmentId = ? AND status = 'PAID'
    `, [id]);

    if (hasPayments && hasPayments.count > 0) {
      throw new AppError('No se puede cancelar una cita con pagos realizados', 400);
    }

    console.log('✅ Validaciones pasadas, procediendo con la cancelación');

    // Actualizar el estado a cancelado y agregar el motivo
    await query(`
      UPDATE appointments 
      SET status = 'CANCELLED', 
          notes = CONCAT(COALESCE(notes, ''), '\n--- CANCELADA ---\nMotivo: ', ?),
          updatedAt = NOW()
      WHERE id = ?
    `, [reason || 'Sin motivo especificado', id]);

    console.log('✅ Cita cancelada exitosamente');

    const response: ApiResponse = {
      success: true,
      message: 'Cita cancelada exitosamente'
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error al cancelar cita:', error);
    next(error);
  }
};

export const deleteAppointment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const appointment = await queryOne<any>(`
      SELECT * FROM appointments WHERE id = ?
    `, [id]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    // No permitir eliminar citas completadas
    if (appointment.status === 'COMPLETED') {
      throw new AppError('No se puede eliminar una cita completada', 400);
    }

    // Verificar si tiene pagos asociados
    const hasPayments = await queryOne<any>(`
      SELECT COUNT(*) as count FROM payments WHERE appointmentId = ?
    `, [id]);

    if (hasPayments && hasPayments.count > 0) {
      throw new AppError('No se puede eliminar una cita con pagos registrados', 400);
    }

    // Eliminar tratamientos de la cita
    await query(`DELETE FROM appointment_treatments WHERE appointmentId = ?`, [id]);
    
    // Eliminar la cita
    await query(`DELETE FROM appointments WHERE id = ?`, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Cita eliminada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getAppointmentsByDate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date } = req.params;
    const employeeId = req.query.employeeId as string;

    let whereClause = 'WHERE DATE(a.date) = ?';
    const params: any[] = [date];

    if (employeeId) {
      whereClause += ' AND a.employeeId = ?';
      params.push(employeeId);
    }

    const appointments = await query<any>(`
      SELECT 
        a.*,
        c.clientCode,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.phone as clientPhone,
        e.position as employeePosition,
        ue.firstName as employeeFirstName,
        ue.lastName as employeeLastName,
        GROUP_CONCAT(t.name SEPARATOR ', ') as treatments
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN users ue ON e.userId = ue.id
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.startTime ASC
    `, params);

    const response: ApiResponse = {
      success: true,
      message: 'Citas obtenidas exitosamente',
      data: appointments
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
