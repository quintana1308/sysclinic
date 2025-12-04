import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse, AppointmentStatus } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/auth';
import { generateInvoiceFromAppointment } from './invoice.controller';

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
    const clientId = req.query.clientId as string;
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

    if (clientId) {
      whereClause += ` AND a.clientId = ?`;
      params.push(clientId);
    }

    if (startDate) {
      whereClause += ` AND DATE(a.date) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND DATE(a.date) <= ?`;
      params.push(endDate);
    }

    // Obtener total de registros
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN users ue ON e.userId = ue.id
      ${whereClause}
    `, params);

    const total = totalResult?.total || 0;

    // Obtener citas paginadas
    const appointments = await query<any>(`
      SELECT 
        a.*,
        c.clientCode,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.email as clientEmail,
        uc.phone as clientPhone,
        e.position as employeePosition,
        ue.firstName as employeeFirstName,
        ue.lastName as employeeLastName,
        GROUP_CONCAT(
          CONCAT(t.name, ' ($', at.price, ' x', at.quantity, ')')
          SEPARATOR ', '
        ) as treatments,
        SUM(at.price * at.quantity) as calculatedTotal
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN users ue ON e.userId = ue.id
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      ${whereClause}
      GROUP BY a.id
      ORDER BY a.date DESC, a.startTime DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

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
        e.position as employeePosition,
        ue.firstName as employeeFirstName,
        ue.lastName as employeeLastName
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN employees e ON a.employeeId = e.id
      LEFT JOIN users ue ON e.userId = ue.id
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

    const response: ApiResponse = {
      success: true,
      message: 'Cita obtenida exitosamente',
      data: {
        ...appointment,
        treatments,
        payments
      }
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
    console.log('Validating client:', { clientId, companyId });
    
    const client = await queryOne(`
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
    
    console.log('Client found:', client);
    
    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }
    
    // Verificar si el cliente pertenece a la empresa (según estructura real)
    if (!req.user?.isMaster && client.companyId !== companyId) {
      throw new AppError('Cliente no pertenece a tu empresa', 403);
    }

    // Verificar que el empleado existe y pertenece a la empresa (si se especifica)
    if (employeeId) {
      console.log('Validating employee:', { employeeId, companyId });
      
      const employee = await queryOne(`
        SELECT id, companyId FROM employees WHERE id = ? AND isActive = 1
      `, [employeeId]);
      
      console.log('Employee found:', employee);
      
      if (!employee) {
        throw new AppError('Empleado no encontrado o inactivo', 404);
      }
      
      // Verificar empresa (más flexible para usuarios master)
      if (!req.user?.isMaster && employee.companyId !== companyId) {
        throw new AppError('Empleado no pertenece a tu empresa', 403);
      }
    }

    // Verificar disponibilidad del empleado
    if (employeeId) {
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
      `, [employeeId, date, startDateTimeStr, startDateTimeStr, endDateTimeStr, endDateTimeStr, startDateTimeStr, endDateTimeStr]);

      if (conflictingAppointment) {
        throw new AppError('El empleado ya tiene una cita en ese horario', 400);
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
    
    await query(`
      INSERT INTO appointments (
        id, companyId, clientId, employeeId, date, startTime, endTime, 
        status, notes, totalAmount, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?, ?, NOW(), NOW())
    `, [
      appointmentId, companyId, clientId, employeeId || null, date, 
      `${date} ${startTime}`, `${date} ${endTime}`, 
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

    // Validar fecha si se proporciona
    if (date && startTime) {
      const appointmentDate = new Date(`${date}T${startTime}`);
      const now = new Date();
      
      if (appointmentDate < now) {
        throw new AppError('No se pueden programar citas en el pasado', 400);
      }
    }

    // Verificar disponibilidad del empleado si se cambia
    if (employeeId && (date || startTime || endTime)) {
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
      `, [employeeId, id, checkDate, checkStartTime, checkStartTime, checkEndTime, checkEndTime, checkStartTime, checkEndTime]);

      if (conflictingAppointment) {
        throw new AppError('El empleado ya tiene una cita en ese horario', 400);
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

    // Actualizar la cita
    await query(`
      UPDATE appointments 
      SET employeeId = ?, date = ?, startTime = ?, endTime = ?, 
          notes = ?, totalAmount = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      employeeId !== undefined ? employeeId : appointment.employeeId,
      date || appointment.date,
      date && startTime ? `${date} ${startTime}` : appointment.startTime,
      date && endTime ? `${date} ${endTime}` : appointment.endTime,
      notes !== undefined ? notes : appointment.notes,
      totalAmount,
      id
    ]);

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

    if (!status || !Object.values(AppointmentStatus).includes(status)) {
      throw new AppError('Estado de cita inválido', 400);
    }

    const appointment = await queryOne<any>(`
      SELECT * FROM appointments WHERE id = ?
    `, [id]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    await query(`
      UPDATE appointments SET status = ?, updatedAt = NOW()
      WHERE id = ?
    `, [status, id]);

    // Si el estado cambia a 'CONFIRMED', generar factura automáticamente
    let invoiceId = null;
    if (status === 'CONFIRMED' && appointment.status !== 'CONFIRMED') {
      try {
        invoiceId = await generateInvoiceFromAppointment(id, req.user?.id);
        console.log(`✅ Factura generada automáticamente: ${invoiceId} para cita: ${id}`);
      } catch (invoiceError) {
        console.error('Error generando factura automática:', invoiceError);
        // No fallar la actualización de la cita si hay error en la factura
      }
    }

    const response: ApiResponse = {
      success: true,
      message: `Cita marcada como ${status.toLowerCase()}${invoiceId ? '. Factura generada automáticamente.' : ''}`,
      data: invoiceId ? { invoiceId } : undefined
    };

    res.json(response);
  } catch (error) {
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
