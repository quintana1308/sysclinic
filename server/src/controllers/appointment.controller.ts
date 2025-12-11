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

    // Obtener todas las citas sin LIMIT/OFFSET para compatibilidad Railway MySQL
    const allAppointments = await query<any>(`
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
    `, params);

    // Aplicar paginación manual
    const appointments = allAppointments.slice(offset, offset + limit);

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
      employeeId !== undefined ? employeeId : appointment.employeeId,
      updateDate,
      updateStartTime,
      updateEndTime,
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

    console.log('🔄 Actualizando estado de cita:', { id, status });

    // Validar que el estado sea válido
    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
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

    // Si el estado cambia a CONFIRMED, generar factura automáticamente
    if (status === 'CONFIRMED' && appointment.status !== 'CONFIRMED') {
      console.log('💰 ¡CONDICIÓN CUMPLIDA! Cita completada - generando factura automáticamente...');
      
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
                id, clientId, appointmentId, amount, description, dueDate, status, createdAt, updatedAt
              )
              VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())
            `, [
              newInvoiceId, 
              appointmentWithTreatments.clientId, 
              id, 
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
      console.log('   - Razón: El estado no cambió a COMPLETED o ya era COMPLETED');
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
