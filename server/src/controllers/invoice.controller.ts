import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { query, queryOne } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/auth';

// Interfaces
interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

interface PaginatedResponse extends ApiResponse {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Obtener todas las facturas
export const getInvoices = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 === OBTENIENDO FACTURAS CON FILTROS ===');
    console.log('📥 Query parameters recibidos:', req.query);
    
    // Extraer parámetros de filtro
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      clientId
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const offset = (pageNum - 1) * limitNum;

    console.log('📊 Parámetros procesados:', {
      page: pageNum,
      limit: limitNum,
      offset,
      search,
      status,
      clientId
    });

    // Construir condiciones WHERE
    const whereConditions: string[] = ['1=1'];
    const queryParams: any[] = [];

    // Filtro por empresa si aplica
    if (req.companyId) {
      whereConditions.push('c.companyId = ?');
      queryParams.push(req.companyId);
    }

    // Filtro de búsqueda (cliente, descripción)
    if (search && search.trim()) {
      whereConditions.push(`(
        CONCAT(uc.firstName, ' ', uc.lastName) LIKE ? OR
        uc.email LIKE ? OR
        i.description LIKE ? OR
        i.id LIKE ?
      )`);
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filtro por estado
    if (status && status.trim()) {
      whereConditions.push('i.status = ?');
      queryParams.push(status);
    }

    // Filtro por cliente específico
    if (clientId && clientId.trim()) {
      whereConditions.push('i.clientId = ?');
      queryParams.push(clientId);
    }

    const whereClause = whereConditions.join(' AND ');
    console.log('🔍 WHERE clause construido:', whereClause);
    console.log('📋 Parámetros de consulta:', queryParams);

    // Obtener total de registros para paginación
    const totalQuery = `
      SELECT COUNT(DISTINCT i.id) as total
      FROM invoices i
      LEFT JOIN clients c ON i.clientId = c.id
      LEFT JOIN users uc ON c.userId = uc.id
      WHERE ${whereClause}
    `;

    const totalResult = await query<any>(totalQuery, queryParams);
    const total = totalResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    console.log('📊 Totales calculados:', { total, totalPages });

    // Obtener facturas con información del cliente y pagos relacionados
    const invoicesQuery = `
      SELECT 
        i.id,
        i.clientId,
        i.appointmentId,
        i.amount,
        i.status,
        i.description,
        i.dueDate,
        i.createdAt,
        i.updatedAt,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.email as clientEmail,
        uc.phone as clientPhone,
        CONCAT(uc.firstName, ' ', uc.lastName) as clientName,
        CASE 
          WHEN i.dueDate < CURDATE() AND i.status IN ('PENDING', 'PARTIAL') THEN 1
          ELSE 0
        END as isOverdue,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        COUNT(p.id) as paymentCount,
        (i.amount - COALESCE(SUM(p.amount), 0)) as remainingAmount
      FROM invoices i
      LEFT JOIN clients c ON i.clientId = c.id
      LEFT JOIN users uc ON c.userId = uc.id
      LEFT JOIN payments p ON i.id = p.invoiceId AND p.status = 'PAID'
      WHERE ${whereClause}
      GROUP BY i.id, i.clientId, i.appointmentId, i.amount, i.status, i.description, i.dueDate, i.createdAt, i.updatedAt, uc.firstName, uc.lastName, uc.email, uc.phone
      ORDER BY i.createdAt DESC
    `;

    // Obtener todas las facturas y aplicar paginación manual (compatible con Railway)
    const allInvoices = await query<any>(invoicesQuery, queryParams);
    const invoices = allInvoices.slice(offset, offset + limitNum);

    console.log('📋 Facturas encontradas:', {
      total: allInvoices?.length || 0,
      enPagina: invoices?.length || 0,
      pagina: pageNum,
      totalPaginas: totalPages
    });

    if (invoices && invoices.length > 0) {
      console.log('📋 Primera factura de ejemplo:', {
        id: invoices[0].id,
        clientName: invoices[0].clientName,
        clientEmail: invoices[0].clientEmail,
        amount: invoices[0].amount,
        status: invoices[0].status,
        totalPaid: invoices[0].totalPaid,
        paymentCount: invoices[0].paymentCount
      });
    }

    const response: PaginatedResponse = {
      success: true,
      message: 'Facturas obtenidas exitosamente',
      data: invoices || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };

    console.log('✅ Respuesta enviada:', {
      success: response.success,
      dataLength: response.data?.length || 0,
      pagination: response.pagination
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Error in getInvoices:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener facturas: ' + (error as Error).message,
      data: []
    });
  }
};

// Obtener factura por ID
export const getInvoiceById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Obtener información de la factura
    const invoice = await queryOne<any>(`
      SELECT 
        i.*,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.email as clientEmail,
        uc.phone as clientPhone,
        CONCAT(uc.firstName, ' ', uc.lastName) as clientName,
        c.address as clientAddress,
        CASE 
          WHEN i.dueDate < CURDATE() AND i.status IN ('PENDING', 'PARTIAL') THEN 1
          ELSE 0
        END as isOverdue,
        COALESCE(SUM(p.amount), 0) as totalPaid,
        COUNT(p.id) as paymentCount,
        (i.amount - COALESCE(SUM(p.amount), 0)) as remainingAmount
      FROM invoices i
      LEFT JOIN clients c ON i.clientId = c.id
      LEFT JOIN users uc ON c.userId = uc.id
      LEFT JOIN payments p ON i.id = p.invoiceId AND p.status = 'PAID'
      WHERE i.id = ? ${req.companyId ? 'AND c.companyId = ?' : ''}
      GROUP BY i.id, i.clientId, i.appointmentId, i.amount, i.status, i.description, i.dueDate, i.createdAt, i.updatedAt, uc.firstName, uc.lastName, uc.email, uc.phone, c.address
    `, req.companyId ? [id, req.companyId] : [id]);

    console.log('🔍 Depuración getInvoiceById:');
    console.log('📋 ID de factura solicitado:', id);
    console.log('🏢 Company ID del request:', req.companyId);
    console.log('📄 Factura encontrada:', invoice);

    if (!invoice) {
      console.log('❌ Factura no encontrada con los criterios dados');
      throw new AppError('Factura no encontrada', 404);
    }

    console.log('✅ Información del cliente en la factura:');
    console.log('👤 clientFirstName:', invoice.clientFirstName);
    console.log('👤 clientLastName:', invoice.clientLastName);
    console.log('👤 clientName:', invoice.clientName);
    console.log('📧 clientEmail:', invoice.clientEmail);
    console.log('🆔 clientId:', invoice.clientId);

    // Obtener historial de pagos de la factura
    const payments = await query<any>(`
      SELECT 
        p.id,
        p.amount,
        CASE 
          WHEN p.method = 'CASH' THEN 'Efectivo'
          WHEN p.method = 'CARD' THEN 'Tarjeta'
          WHEN p.method = 'TRANSFER' THEN 'Transferencia'
          WHEN p.method = 'CHECK' THEN 'Cheque'
          WHEN p.method = 'FINANCING' THEN 'Financiamiento'
          ELSE 'Método no especificado'
        END as method,
        p.status,
        p.description as notes,
        p.transactionId,
        p.paidDate,
        p.createdAt,
        p.invoiceId,
        'Sistema' as createdBy
      FROM payments p
      WHERE p.invoiceId = ? AND p.status = 'PAID'
      ORDER BY p.createdAt DESC
    `, [id]);

    console.log('💳 === CONSULTA DE PAGOS PARA FACTURA ===');
    console.log('🔍 ID de factura:', id);
    console.log('📊 Pagos encontrados:', payments?.length || 0);
    if (payments && payments.length > 0) {
      console.log('💰 Primer pago de ejemplo:', {
        id: payments[0].id,
        amount: payments[0].amount,
        method: payments[0].method,
        status: payments[0].status,
        paidDate: payments[0].paidDate
      });
    }

    // Agregar historial de pagos a la factura
    const invoiceWithPayments = {
      ...invoice,
      paymentHistory: payments || []
    };

    console.log('📤 Respuesta final enviada al frontend:');
    console.log('🔗 invoiceWithPayments.clientName:', invoiceWithPayments.clientName);
    console.log('🔗 invoiceWithPayments.clientFirstName:', invoiceWithPayments.clientFirstName);
    console.log('🔗 invoiceWithPayments.clientLastName:', invoiceWithPayments.clientLastName);
    console.log('📊 Cantidad de pagos en historial:', payments?.length || 0);
    console.log('💳 paymentHistory completo:', invoiceWithPayments.paymentHistory);

    const response: ApiResponse = {
      success: true,
      message: 'Factura obtenida exitosamente',
      data: invoiceWithPayments
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Crear factura manualmente
export const createInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      clientId,
      appointmentId,
      amount,
      description,
      dueDate
    } = req.body;

    // Validaciones básicas
    if (!clientId || !amount) {
      throw new AppError('Cliente y monto son requeridos', 400);
    }

    if (amount <= 0) {
      throw new AppError('El monto debe ser mayor a 0', 400);
    }

    // Verificar que el cliente existe
    const client = await queryOne(`
      SELECT id FROM clients WHERE id = ?
    `, [clientId]);

    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    // Si hay appointmentId, verificar que existe
    if (appointmentId) {
      const appointment = await queryOne(`
        SELECT id FROM appointments WHERE id = ?
      `, [appointmentId]);

      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }
    }

    const invoiceId = generateId();
    
    await query(`
      INSERT INTO invoices (
        id, clientId, appointmentId, amount, subtotal, description, dueDate, status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())
    `, [
      invoiceId, clientId, appointmentId || null, amount, amount, description || null, dueDate || null
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Factura creada exitosamente',
      data: {
        id: invoiceId,
        clientId,
        appointmentId,
        amount,
        status: 'PENDING'
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Actualizar factura
export const updateInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      amount,
      status,
      description,
      dueDate
    } = req.body;

    // Verificar que la factura existe
    const invoice = await queryOne<any>(`
      SELECT * FROM invoices WHERE id = ?
    `, [id]);

    if (!invoice) {
      throw new AppError('Factura no encontrada', 404);
    }

    // Validaciones
    if (amount !== undefined && amount <= 0) {
      throw new AppError('El monto debe ser mayor a 0', 400);
    }

    if (status && !['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'].includes(status)) {
      throw new AppError('Estado de factura inválido', 400);
    }

    await query(`
      UPDATE invoices 
      SET amount = ?, status = ?, description = ?, dueDate = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      amount !== undefined ? amount : invoice.amount,
      status || invoice.status,
      description !== undefined ? description : invoice.description,
      dueDate !== undefined ? dueDate : invoice.dueDate,
      id
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Factura actualizada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Eliminar factura
export const deleteInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const invoice = await queryOne(`
      SELECT id FROM invoices WHERE id = ?
    `, [id]);

    if (!invoice) {
      throw new AppError('Factura no encontrada', 404);
    }

    await query(`
      DELETE FROM invoices WHERE id = ?
    `, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Factura eliminada exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Generar factura automáticamente desde una cita
export const generateInvoiceFromAppointment = async (
  appointmentId: string,
  userId?: string
): Promise<string> => {
  try {
    // Obtener información de la cita con tratamientos
    const appointment = await queryOne<any>(`
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
    `, [appointmentId]);

    if (!appointment) {
      throw new AppError('Cita no encontrada', 404);
    }

    // Verificar si ya existe una factura para esta cita
    const existingInvoice = await queryOne(`
      SELECT id FROM invoices WHERE appointmentId = ?
    `, [appointmentId]);

    if (existingInvoice) {
      return existingInvoice.id;
    }

    const invoiceId = generateId();
    
    // Asegurar que el monto sea un número válido
    let amount = 0;
    if (appointment.totalAmount && !isNaN(parseFloat(appointment.totalAmount))) {
      amount = parseFloat(appointment.totalAmount);
    }
    
    console.log('💰 Monto calculado para la factura:', amount, 'desde totalAmount:', appointment.totalAmount);
    
    const clientName = `${appointment.clientFirstName} ${appointment.clientLastName}`;
    const description = `Factura por ${appointment.treatmentNames || 'Tratamientos'} - ${clientName}`;
    
    // Calcular fecha de vencimiento (30 días después de la cita)
    const appointmentDate = new Date(appointment.date);
    const dueDate = new Date(appointmentDate);
    dueDate.setDate(dueDate.getDate() + 30);

    await query(`
      INSERT INTO invoices (
        id, clientId, appointmentId, amount, subtotal, description, dueDate, status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())
    `, [
      invoiceId, 
      appointment.clientId, 
      appointmentId, 
      amount, 
      amount,
      description, 
      dueDate.toISOString().split('T')[0]
    ]);

    return invoiceId;
  } catch (error) {
    console.error('Error generating invoice from appointment:', error);
    throw error;
  }
};

// Obtener estadísticas de facturas
export const getInvoiceStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await queryOne<any>(`
      SELECT 
        COUNT(*) as totalInvoices,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingInvoices,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paidInvoices,
        SUM(CASE WHEN status = 'OVERDUE' THEN 1 ELSE 0 END) as overdueInvoices,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledInvoices,
        SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as totalPaid,
        SUM(CASE WHEN status IN ('PENDING', 'PARTIAL', 'OVERDUE') THEN amount ELSE 0 END) as totalPending,
        AVG(amount) as averageAmount
      FROM invoices
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas de facturas obtenidas exitosamente',
      data: stats || {
        totalInvoices: 0,
        pendingInvoices: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
        cancelledInvoices: 0,
        totalPaid: 0,
        totalPending: 0,
        averageAmount: 0
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Marcar facturas vencidas
export const markOverdueInvoices = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await query(`
      UPDATE invoices 
      SET status = 'OVERDUE', updatedAt = NOW()
      WHERE dueDate < CURDATE() 
      AND status IN ('PENDING', 'PARTIAL')
    `);

    const affectedRows = Array.isArray(result) ? result.length : (result as any).affectedRows || 0;

    const response: ApiResponse = {
      success: true,
      message: `${affectedRows} facturas marcadas como vencidas`
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Aplicar descuento a factura
export const applyDiscountToInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { discountType, discountValue, discountReason } = req.body;

    console.log('💰 Aplicando descuento a factura:', {
      invoiceId: id,
      discountType,
      discountValue,
      discountReason,
      userId: req.user?.id
    });

    // Validaciones
    if (!discountType || discountValue === undefined || !discountReason) {
      throw new AppError('Tipo de descuento, valor y motivo son requeridos', 400);
    }

    if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
      throw new AppError('Tipo de descuento inválido', 400);
    }

    if (discountValue < 0) {
      throw new AppError('El valor del descuento no puede ser negativo', 400);
    }

    // Obtener factura actual
    const invoice = await queryOne<any>(`
      SELECT * FROM invoices WHERE id = ?
    `, [id]);

    if (!invoice) {
      throw new AppError('Factura no encontrada', 404);
    }

    // Validar que la factura no esté totalmente pagada
    if (invoice.status === 'PAID') {
      throw new AppError('No se puede aplicar descuento a una factura que ya está totalmente pagada', 400);
    }

    console.log('📋 Factura encontrada:', {
      id: invoice.id,
      currentAmount: invoice.amount,
      currentSubtotal: invoice.subtotal,
      status: invoice.status,
      hasDiscount: !!invoice.discountValue
    });

    // Calcular subtotal si no existe (para facturas existentes)
    // Si subtotal es 0 o null, usar el amount como subtotal
    let subtotal = parseFloat(invoice.subtotal) || parseFloat(invoice.amount);
    
    console.log('🔍 Debugging validación de descuento:', {
      discountType,
      discountValue,
      invoiceAmount: invoice.amount,
      invoiceSubtotal: invoice.subtotal,
      calculatedSubtotal: subtotal,
      discountValueType: typeof discountValue,
      subtotalType: typeof subtotal
    });

    // Validaciones específicas por tipo de descuento
    if (discountType === 'PERCENTAGE') {
      if (discountValue > 100) {
        throw new AppError('El porcentaje de descuento no puede ser mayor al 100%', 400);
      }
    } else if (discountType === 'FIXED') {
      console.log('🔍 Validando descuento fijo:', {
        discountValue,
        subtotal,
        comparison: `${discountValue} > ${subtotal}`,
        result: discountValue > subtotal
      });
      
      if (discountValue > subtotal) {
        throw new AppError(`El descuento fijo ($${discountValue}) no puede ser mayor al subtotal ($${subtotal})`, 400);
      }
    }

    // Calcular nuevo monto
    let discountAmount = 0;
    if (discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    const finalAmount = subtotal - discountAmount;

    console.log('🧮 Cálculos de descuento:', {
      subtotal,
      discountType,
      discountValue,
      discountAmount,
      finalAmount
    });

    // Actualizar factura con descuento
    await query(`
      UPDATE invoices 
      SET 
        subtotal = ?,
        discountType = ?,
        discountValue = ?,
        discountReason = ?,
        discountAppliedBy = ?,
        discountAppliedAt = NOW(),
        amount = ?,
        updatedAt = NOW()
      WHERE id = ?
    `, [subtotal, discountType, discountValue, discountReason, req.user?.id, finalAmount, id]);

    console.log('✅ Descuento aplicado exitosamente a factura:', id);

    const response: ApiResponse = {
      success: true,
      message: 'Descuento aplicado exitosamente',
      data: {
        invoiceId: id,
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        finalAmount,
        discountReason
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error aplicando descuento:', error);
    next(error);
  }
};

// Remover descuento de factura
export const removeDiscountFromInvoice = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Removiendo descuento de factura:', id);

    // Obtener factura actual
    const invoice = await queryOne<any>(`
      SELECT * FROM invoices WHERE id = ?
    `, [id]);

    if (!invoice) {
      throw new AppError('Factura no encontrada', 404);
    }

    // Validar que la factura no esté totalmente pagada
    if (invoice.status === 'PAID') {
      throw new AppError('No se puede remover descuento de una factura que ya está totalmente pagada', 400);
    }

    if (!invoice.discountValue || invoice.discountValue === 0) {
      throw new AppError('Esta factura no tiene descuento aplicado', 400);
    }

    console.log('📋 Factura con descuento encontrada:', {
      id: invoice.id,
      currentAmount: invoice.amount,
      subtotal: invoice.subtotal,
      discountType: invoice.discountType,
      discountValue: invoice.discountValue
    });

    // Restaurar monto original (subtotal)
    const originalAmount = invoice.subtotal || invoice.amount;

    await query(`
      UPDATE invoices 
      SET 
        discountType = NULL,
        discountValue = 0,
        discountReason = NULL,
        discountAppliedBy = NULL,
        discountAppliedAt = NULL,
        amount = ?,
        updatedAt = NOW()
      WHERE id = ?
    `, [originalAmount, id]);

    console.log('✅ Descuento removido exitosamente de factura:', id);

    const response: ApiResponse = {
      success: true,
      message: 'Descuento removido exitosamente',
      data: {
        invoiceId: id,
        originalAmount,
        discountRemoved: true
      }
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error removiendo descuento:', error);
    next(error);
  }
};
