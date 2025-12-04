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

// Crear nuevo pago
// Función de debug para verificar pagos
export const debugPayments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { invoiceId } = req.params;
    
    console.log('🐛 DEBUG: Verificando pagos para factura:', invoiceId);
    
    // Consulta simple para ver todos los pagos
    const allPayments = await query<any>(`
      SELECT * FROM payments WHERE invoiceId = ?
    `, [invoiceId]);
    
    console.log('🐛 DEBUG: Pagos encontrados:', allPayments);
    
    res.json({
      success: true,
      data: allPayments,
      message: `Encontrados ${allPayments.length} pagos para la factura ${invoiceId}`
    });
  } catch (error) {
    next(error);
  }
};

export const createPayment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { appointmentId, invoiceId, amount, method, notes, transactionId } = req.body;

    if (!amount || !method) {
      throw new AppError('Faltan campos requeridos: amount, method', 400);
    }

    let clientId = null;

    // Si se proporciona invoiceId, obtener el clientId de la factura (prioridad)
    if (invoiceId) {
      const invoice = await queryOne<any>(`
        SELECT i.id, i.clientId, c.companyId, c.id as clientExists
        FROM invoices i
        LEFT JOIN clients c ON i.clientId = c.id
        WHERE i.id = ? ${req.companyId ? 'AND c.companyId = ?' : ''}
      `, req.companyId ? [invoiceId, req.companyId] : [invoiceId]);

      console.log('🔍 Factura encontrada:', {
        invoiceId,
        invoice,
        companyId: req.companyId
      });

      if (!invoice) {
        throw new AppError('Factura no encontrada', 404);
      }

      if (!invoice.clientExists) {
        throw new AppError('Cliente de la factura no existe o no pertenece a esta empresa', 400);
      }

      clientId = invoice.clientId;
    }
    // Si NO se proporciona invoiceId pero sí appointmentId, obtener el clientId de la cita
    else if (appointmentId) {
      const appointment = await queryOne<any>(`
        SELECT a.id, a.clientId, a.companyId 
        FROM appointments a 
        WHERE a.id = ? ${req.companyId ? 'AND a.companyId = ?' : ''}
      `, req.companyId ? [appointmentId, req.companyId] : [appointmentId]);

      if (!appointment) {
        throw new AppError('Cita no encontrada', 404);
      }
      clientId = appointment.clientId;
    }

    if (!clientId) {
      throw new AppError('Debe proporcionar appointmentId o invoiceId válido', 400);
    }

    console.log('💰 Insertando pago con datos:', {
      clientId,
      appointmentId: appointmentId || null,
      invoiceId: invoiceId || null,
      amount,
      method,
      notes: notes || null,
      transactionId: transactionId || null
    });

    const insertResult = await query(`
      INSERT INTO payments (
        clientId, appointmentId, invoiceId, amount, method, status, description, transactionId, paidDate
      )
      VALUES (?, ?, ?, ?, ?, 'PAID', ?, ?, NOW())
    `, [
      clientId,
      appointmentId || null,
      invoiceId || null,
      amount,
      method,
      notes || null,
      transactionId || null
    ]);

    console.log('✅ Pago creado exitosamente para cliente:', clientId);
    console.log('💾 Datos del pago insertado:', {
      clientId,
      appointmentId: appointmentId || null,
      invoiceId: invoiceId || null,
      amount,
      method,
      status: 'PAID',
      description: notes || null,
      transactionId: transactionId || null
    });
    
    // Verificar que el pago se guardó correctamente
    const savedPayment = await query(`
      SELECT * FROM payments WHERE clientId = ? AND amount = ? AND method = ? ORDER BY createdAt DESC LIMIT 1
    `, [clientId, amount, method]);
    
    console.log('🔍 Pago guardado verificado:', savedPayment[0]);

    const response: ApiResponse = {
      success: true,
      message: 'Pago registrado exitosamente',
      data: { clientId, amount, method }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Obtener todos los pagos
export const getPayments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const method = req.query.method as string;
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
      whereClause += ` AND c.companyId = ?`;
      params.push(req.user.companies.current.id);
    } else if (req.companyId) {
      whereClause += ` AND c.companyId = ?`;
      params.push(req.companyId);
    }

    if (search) {
      whereClause += ` AND (uc.firstName LIKE ? OR uc.lastName LIKE ? OR uc.email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ` AND p.status = ?`;
      params.push(status);
    }

    if (method) {
      whereClause += ` AND p.method = ?`;
      params.push(method);
    }

    if (startDate) {
      whereClause += ` AND DATE(p.createdAt) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      whereClause += ` AND DATE(p.createdAt) <= ?`;
      params.push(endDate);
    }

    // Obtener total de registros
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total
      FROM payments p
      LEFT JOIN appointments a ON p.appointmentId = a.id
      INNER JOIN clients c ON p.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      ${whereClause}
    `, params);

    const total = totalResult?.total || 0;

    // Obtener pagos paginados
    const payments = await query<any>(`
      SELECT 
        p.*,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.email as clientEmail,
        CONCAT(uc.firstName, ' ', uc.lastName) as clientName,
        a.date as appointmentDate,
        a.startTime as appointmentTime,
        GROUP_CONCAT(t.name SEPARATOR ', ') as treatmentNames
      FROM payments p
      LEFT JOIN appointments a ON p.appointmentId = a.id
      INNER JOIN clients c ON p.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const response: PaginatedResponse = {
      success: true,
      message: 'Pagos obtenidos exitosamente',
      data: payments,
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

// Obtener pago por ID
export const getPaymentById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const payment = await queryOne<any>(`
      SELECT 
        p.*,
        uc.firstName as clientFirstName,
        uc.lastName as clientLastName,
        uc.email as clientEmail,
        CONCAT(uc.firstName, ' ', uc.lastName) as clientName,
        a.date as appointmentDate,
        a.startTime as appointmentTime,
        GROUP_CONCAT(t.name SEPARATOR ', ') as treatmentNames
      FROM payments p
      INNER JOIN appointments a ON p.appointmentId = a.id
      INNER JOIN clients c ON p.clientId = c.id
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `, [id]);

    if (!payment) {
      throw new AppError('Pago no encontrado', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Pago obtenido exitosamente',
      data: payment
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas de pagos
export const getPaymentStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await queryOne<any>(`
      SELECT 
        COUNT(*) as totalPayments,
        SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paidPayments,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingPayments,
        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledPayments,
        SUM(CASE WHEN status = 'REFUNDED' THEN 1 ELSE 0 END) as refundedPayments,
        SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as totalRevenue,
        AVG(CASE WHEN status = 'PAID' THEN amount ELSE NULL END) as averagePayment
      FROM payments p
      INNER JOIN appointments a ON p.appointmentId = a.id
      WHERE 1=1
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats || {
        totalPayments: 0,
        paidPayments: 0,
        pendingPayments: 0,
        cancelledPayments: 0,
        refundedPayments: 0,
        totalRevenue: 0,
        averagePayment: 0
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
