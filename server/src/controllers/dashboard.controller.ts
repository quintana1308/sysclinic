import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.user?.currentCompanyId;
    
    console.log('🔍 Dashboard Stats - CompanyId:', companyId);
    console.log('🔍 Dashboard Stats - User:', req.user);
    
    // Verificar datos básicos primero
    const basicCheck = await queryOne<any>(`
      SELECT 
        (SELECT COUNT(*) FROM clients) as totalClientsAll,
        (SELECT COUNT(*) FROM appointments) as totalAppointmentsAll,
        (SELECT COUNT(*) FROM appointments WHERE DATE(date) = CURDATE()) as appointmentsToday,
        (SELECT COUNT(*) FROM clients c INNER JOIN users u ON c.userId = u.id WHERE c.createdAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND u.isActive = 1) as clientsThisMonth,
        (SELECT COUNT(*) FROM users WHERE isActive = 1) as totalActiveUsers,
        CURDATE() as currentDate,
        DATE_FORMAT(CURDATE(), '%Y-%m-01') as firstDayOfMonth
    `);
    
    console.log('🔍 Basic data check:', basicCheck);
    
    // Verificar usuarios inactivos
    const userCheck = await queryOne<any>(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE isActive = 1) as activeUsers,
        (SELECT COUNT(*) FROM users WHERE isActive = 0) as inactiveUsers,
        (SELECT COUNT(*) FROM clients c INNER JOIN users u ON c.userId = u.id WHERE u.isActive = 0) as clientsWithInactiveUsers
    `);
    
    console.log('🔍 User check:', userCheck);
    
    // Verificar citas específicamente
    const appointmentCheck = await query<any>(`
      SELECT 
        a.id,
        a.date,
        a.status,
        a.companyId,
        DATE(a.date) as dateOnly,
        CURDATE() as today,
        CASE WHEN DATE(a.date) = CURDATE() THEN 'TODAY' ELSE 'OTHER' END as isToday
      FROM appointments a
      WHERE a.status != 'CANCELLED'
      ORDER BY a.date DESC
      LIMIT 10
    `);
    
    console.log('🔍 Appointment check (últimas 10 citas no canceladas):', appointmentCheck);
    
    // Verificar citas específicamente para hoy
    const todayCheck = await query<any>(`
      SELECT 
        a.id,
        a.date,
        a.status,
        a.companyId,
        DATE(a.date) as dateOnly,
        CURDATE() as today,
        u.firstName as clientFirstName,
        u.lastName as clientLastName
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users u ON c.userId = u.id
      WHERE DATE(a.date) = CURDATE()
      ORDER BY a.startTime ASC
    `);
    
    console.log('🔍 Citas específicamente para HOY (9 de diciembre):', todayCheck);
    
    // Estadísticas generales - temporalmente sin filtro de empresa para debugging
    let stats;
    
    if (!companyId) {
      // Si no hay companyId, mostrar todos los datos
      stats = await queryOne<any>(`
        SELECT 
          COALESCE((SELECT COUNT(*) FROM clients c 
           INNER JOIN users u ON c.userId = u.id 
           WHERE u.isActive = 1), 0) as totalClients,
          COALESCE((SELECT COUNT(*) FROM clients c 
           INNER JOIN users u ON c.userId = u.id 
           WHERE u.isActive = 0), 0) as inactiveClients,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE a.status != 'CANCELLED' AND a.date >= CURDATE()), 0) as totalFutureAppointments,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE a.status = 'SCHEDULED' AND a.date >= CURDATE()), 0) as scheduledAppointments,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE a.status = 'CONFIRMED' AND a.date >= CURDATE()), 0) as confirmedAppointments,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE DATE(a.date) = CURDATE() AND a.status != 'CANCELLED'), 0) as todayAppointments,
          COALESCE((SELECT SUM(p.amount) FROM payments p
           WHERE p.status = 'PAID'
           AND MONTH(p.paidDate) = MONTH(CURDATE()) 
           AND YEAR(p.paidDate) = YEAR(CURDATE())), 0) as monthlyRevenue,
          COALESCE((SELECT COUNT(*) FROM clients c 
           INNER JOIN users u ON c.userId = u.id 
           WHERE c.createdAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND u.isActive = 1), 0) as newClientsThisMonth,
          COALESCE((SELECT COUNT(*) FROM supplies s
           WHERE s.stock <= s.minStock AND s.stock > 0), 0) as lowStockItems,
          COALESCE((SELECT COUNT(*) FROM supplies s
           WHERE s.stock = 0), 0) as outOfStockItems
      `);
    } else {
      // Con companyId
      stats = await queryOne<any>(`
        SELECT 
          COALESCE((SELECT COUNT(*) FROM clients c 
           INNER JOIN users u ON c.userId = u.id 
           WHERE u.isActive = 1 AND (? IS NULL OR c.companyId = ?)), 0) as totalClients,
          COALESCE((SELECT COUNT(*) FROM clients c 
           INNER JOIN users u ON c.userId = u.id 
           WHERE u.isActive = 0 AND (? IS NULL OR c.companyId = ?)), 0) as inactiveClients,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE a.status != 'CANCELLED' AND a.date >= CURDATE() AND (? IS NULL OR a.companyId = ?)), 0) as totalFutureAppointments,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE a.status = 'SCHEDULED' AND a.date >= CURDATE() AND (? IS NULL OR a.companyId = ?)), 0) as scheduledAppointments,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE a.status = 'CONFIRMED' AND a.date >= CURDATE() AND (? IS NULL OR a.companyId = ?)), 0) as confirmedAppointments,
          COALESCE((SELECT COUNT(*) FROM appointments a
           WHERE DATE(a.date) = CURDATE() AND a.status != 'CANCELLED' AND (? IS NULL OR a.companyId = ?)), 0) as todayAppointments,
          COALESCE((SELECT SUM(p.amount) FROM payments p
           INNER JOIN clients c ON p.clientId = c.id
           WHERE p.status = 'PAID'
           AND MONTH(p.paidDate) = MONTH(CURDATE()) 
           AND YEAR(p.paidDate) = YEAR(CURDATE())
           AND (? IS NULL OR c.companyId = ?)), 0) as monthlyRevenue,
          COALESCE((SELECT COUNT(*) FROM clients c 
           INNER JOIN users u ON c.userId = u.id 
           WHERE c.createdAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
           AND u.isActive = 1 AND (? IS NULL OR c.companyId = ?)), 0) as newClientsThisMonth,
          COALESCE((SELECT COUNT(*) FROM supplies s
           WHERE s.stock <= s.minStock AND s.stock > 0), 0) as lowStockItems,
          COALESCE((SELECT COUNT(*) FROM supplies s
           WHERE s.stock = 0), 0) as outOfStockItems
      `, [companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId, companyId]);
    }

    console.log('🔍 Raw stats from DB:', stats);

    // Verificar inconsistencias
    if (parseInt(stats.newClientsThisMonth) > parseInt(stats.totalClients)) {
      console.log('🚨 INCONSISTENCIA DETECTADA: newClientsThisMonth > totalClients');
      console.log('🔍 newClientsThisMonth:', stats.newClientsThisMonth);
      console.log('🔍 totalClients:', stats.totalClients);
    }

    // Asegurar que todos los valores sean números
    const processedStats = {
      totalClients: parseInt(stats.totalClients) || 0,
      inactiveClients: parseInt(stats.inactiveClients) || 0,
      totalFutureAppointments: parseInt(stats.totalFutureAppointments) || 0,
      scheduledAppointments: parseInt(stats.scheduledAppointments) || 0,
      confirmedAppointments: parseInt(stats.confirmedAppointments) || 0,
      todayAppointments: parseInt(stats.todayAppointments) || 0,
      monthlyRevenue: parseFloat(stats.monthlyRevenue) || 0,
      newClientsThisMonth: parseInt(stats.newClientsThisMonth) || 0,
      lowStockItems: parseInt(stats.lowStockItems) || 0,
      outOfStockItems: parseInt(stats.outOfStockItems) || 0
    };

    console.log('🔍 Processed stats:', processedStats);
    
    // Verificar inconsistencias después del procesamiento
    if (processedStats.newClientsThisMonth > processedStats.totalClients) {
      console.log('🚨 INCONSISTENCIA PERSISTE después del procesamiento');
    }

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas del dashboard obtenidas exitosamente',
      data: processedStats
    };

    res.json(response);
  } catch (error) {
    console.error('Error en getDashboardStats:', error);
    next(error);
  }
};

// Nuevo endpoint para obtener toda la data del dashboard
export const getDashboardData = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.user?.currentCompanyId;
    
    // Obtener estadísticas
    const stats = await queryOne<any>(`
      SELECT 
        (SELECT COUNT(*) FROM clients c 
         INNER JOIN users u ON c.userId = u.id 
         INNER JOIN user_companies uc ON u.id = uc.userId 
         WHERE u.isActive = 1 AND uc.companyId = ?) as totalClients,
        (SELECT COUNT(*) FROM appointments a
         INNER JOIN clients c ON a.clientId = c.id
         INNER JOIN users u ON c.userId = u.id
         INNER JOIN user_companies uc ON u.id = uc.userId
         WHERE a.status != 'CANCELLED' AND uc.companyId = ?) as totalAppointments,
        (SELECT COUNT(*) FROM appointments a
         INNER JOIN clients c ON a.clientId = c.id
         INNER JOIN users u ON c.userId = u.id
         INNER JOIN user_companies uc ON u.id = uc.userId
         WHERE DATE(a.date) = CURDATE() AND a.status != 'CANCELLED' AND uc.companyId = ?) as todayAppointments,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
         INNER JOIN clients c ON p.clientId = c.id
         INNER JOIN users u ON c.userId = u.id
         INNER JOIN user_companies uc ON u.id = uc.userId
         WHERE p.status = 'PAID'
         AND MONTH(p.paidDate) = MONTH(CURDATE()) 
         AND YEAR(p.paidDate) = YEAR(CURDATE())
         AND uc.companyId = ?) as monthlyRevenue,
        (SELECT COUNT(*) FROM clients c 
         INNER JOIN users u ON c.userId = u.id 
         INNER JOIN user_companies uc ON u.id = uc.userId 
         WHERE c.createdAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01') 
         AND uc.companyId = ?) as newClientsThisMonth,
        (SELECT COUNT(*) FROM supplies WHERE stock <= minStock AND stock > 0) as lowStockItems,
        (SELECT COUNT(*) FROM supplies WHERE stock = 0) as outOfStockItems
    `, [companyId, companyId, companyId, companyId, companyId]);
    
    // Obtener citas recientes
    const recentAppointments = await query<any>(`
      SELECT 
        a.id,
        a.date,
        a.startTime,
        a.status,
        a.totalAmount,
        a.createdAt,
        u.firstName as clientFirstName,
        u.lastName as clientLastName,
        u.email as clientEmail,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', t.id,
            'name', t.name,
            'duration', t.duration,
            'price', at.price
          ) SEPARATOR '|'
        ) as treatments
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users u ON c.userId = u.id
      INNER JOIN user_companies uc ON u.id = uc.userId
      LEFT JOIN appointment_treatments at ON a.id = at.appointmentId
      LEFT JOIN treatments t ON at.treatmentId = t.id
      WHERE uc.companyId = ?
      GROUP BY a.id
      ORDER BY a.createdAt DESC
      LIMIT 5
    `, [companyId]);

    // Procesar tratamientos
    const processedAppointments = recentAppointments.map((appointment: any) => ({
      ...appointment,
      client: {
        firstName: appointment.clientFirstName,
        lastName: appointment.clientLastName,
        email: appointment.clientEmail
      },
      treatments: appointment.treatments ? 
        appointment.treatments.split('|').map((t: string) => JSON.parse(t)) : []
    }));

    const response: ApiResponse = {
      success: true,
      message: 'Datos del dashboard obtenidos exitosamente',
      data: {
        stats,
        recentAppointments: processedAppointments
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getRecentAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔍 Backend - getRecentAppointments INICIADO');
    const limit = parseInt(req.query.limit as string) || 5;
    const companyId = req.user?.currentCompanyId;
    console.log('🔍 Backend - Usuario completo:', req.user);

    // Consulta para obtener citas futuras (desde ahora en adelante)
    const appointments = await query<any>(`
      SELECT 
        a.id,
        a.date,
        a.startTime,
        a.endTime,
        a.status,
        a.totalAmount,
        a.notes,
        a.createdAt,
        a.companyId,
        u.firstName as clientFirstName,
        u.lastName as clientLastName,
        u.email as clientEmail,
        c.clientCode,
        emp_u.firstName as employeeFirstName,
        emp_u.lastName as employeeLastName,
        'Sin tratamientos' as treatmentData
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      INNER JOIN users u ON c.userId = u.id
      LEFT JOIN employees emp ON a.employeeId = emp.id
      LEFT JOIN users emp_u ON emp.userId = emp_u.id
      WHERE (? IS NULL OR a.companyId = ?) 
        AND a.status != 'CANCELLED'
        AND (
          a.date > CURDATE() 
          OR (a.date = CURDATE() AND a.startTime >= NOW())
        )
      ORDER BY a.date ASC, a.startTime ASC
      LIMIT ?
    `, [companyId, companyId, limit]);

    console.log('🔍 Backend - Datos crudos de citas desde BD:', appointments);
    console.log('🔍 Backend - CompanyId usado:', companyId);
    console.log('🔍 Backend - Limit usado:', limit);

    // Verificar datos básicos de appointments
    const basicAppointmentCheck = await queryOne<any>(`
      SELECT 
        COUNT(*) as totalAppointments,
        COUNT(CASE WHEN status != 'CANCELLED' THEN 1 END) as nonCancelledAppointments,
        COUNT(CASE WHEN companyId = ? THEN 1 END) as appointmentsForCompany
      FROM appointments
    `, [companyId]);
    
    console.log('🔍 Backend - Verificación básica de appointments:', basicAppointmentCheck);

    // Si no hay citas para la empresa, probar sin filtro de empresa (también futuras)
    if (appointments.length === 0) {
      const allAppointments = await query<any>(`
        SELECT 
          a.id,
          a.date,
          a.startTime,
          a.companyId,
          a.status,
          a.createdAt,
          u.firstName as clientFirstName,
          u.lastName as clientLastName
        FROM appointments a
        INNER JOIN clients c ON a.clientId = c.id
        INNER JOIN users u ON c.userId = u.id
        WHERE a.status != 'CANCELLED'
          AND (
            a.date > CURDATE() 
            OR (a.date = CURDATE() AND a.startTime >= NOW())
          )
        ORDER BY a.date ASC, a.startTime ASC
        LIMIT 3
      `);
      
      console.log('🔍 Backend - Todas las citas futuras (sin filtro de empresa):', allAppointments);
    }

    // Procesar tratamientos y datos
    const processedAppointments = appointments.map((appointment: any) => {
      let treatments: any[] = [];
      
      if (appointment.treatmentData) {
        treatments = appointment.treatmentData.split('||').map((treatmentStr: string) => {
          const [name, price, duration] = treatmentStr.split('|');
          return {
            name: name || 'Tratamiento no especificado',
            price: parseFloat(price) || 0,
            duration: parseInt(duration) || 0
          };
        });
      }

      return {
        id: appointment.id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        totalAmount: parseFloat(appointment.totalAmount) || 0,
        notes: appointment.notes,
        createdAt: appointment.createdAt,
        client: {
          firstName: appointment.clientFirstName || '',
          lastName: appointment.clientLastName || '',
          email: appointment.clientEmail || '',
          clientCode: appointment.clientCode || ''
        },
        employee: {
          firstName: appointment.employeeFirstName || '',
          lastName: appointment.employeeLastName || ''
        },
        treatments: treatments
      };
    });

    console.log('🔍 Backend - Citas recientes procesadas:', processedAppointments);
    console.log('🔍 Backend - Número de citas encontradas:', processedAppointments.length);

    const response: ApiResponse = {
      success: true,
      message: 'Citas recientes obtenidas exitosamente',
      data: processedAppointments
    };

    console.log('🔍 Backend - Enviando respuesta al frontend:', response);
    res.json(response);
  } catch (error) {
    console.error('🔍 Backend - ERROR en getRecentAppointments:', error);
    next(error);
  }
};

export const getTodayAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
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
      WHERE DATE(a.date) = CURDATE()
        AND a.status != 'CANCELLED'
      GROUP BY a.id
      ORDER BY a.startTime ASC
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Citas de hoy obtenidas exitosamente',
      data: appointments
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getUpcomingAppointments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const days = parseInt(req.query.days as string) || 7;

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
      WHERE a.date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
        AND a.status IN ('SCHEDULED', 'CONFIRMED')
      GROUP BY a.id
      ORDER BY a.date ASC, a.startTime ASC
    `, [days]);

    const response: ApiResponse = {
      success: true,
      message: 'Próximas citas obtenidas exitosamente',
      data: appointments
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getRevenueStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const period = req.query.period as string || 'month'; // month, quarter, year

    let dateFilter = '';
    switch (period) {
      case 'month':
        dateFilter = 'AND MONTH(p.createdAt) = MONTH(CURDATE()) AND YEAR(p.createdAt) = YEAR(CURDATE())';
        break;
      case 'quarter':
        dateFilter = 'AND QUARTER(p.createdAt) = QUARTER(CURDATE()) AND YEAR(p.createdAt) = YEAR(CURDATE())';
        break;
      case 'year':
        dateFilter = 'AND YEAR(p.createdAt) = YEAR(CURDATE())';
        break;
    }

    const revenueStats = await queryOne<any>(`
      SELECT 
        COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) as totalRevenue,
        COALESCE(SUM(CASE WHEN p.status = 'PENDING' THEN p.amount ELSE 0 END), 0) as pendingRevenue,
        COUNT(CASE WHEN p.status = 'PAID' THEN 1 END) as paidPayments,
        COUNT(CASE WHEN p.status = 'PENDING' THEN 1 END) as pendingPayments
      FROM payments p
      WHERE 1=1 ${dateFilter}
    `);

    // Ingresos por método de pago
    const revenueByMethod = await query<any>(`
      SELECT 
        p.method,
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(*) as count
      FROM payments p
      WHERE p.status = 'PAID' ${dateFilter}
      GROUP BY p.method
      ORDER BY revenue DESC
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas de ingresos obtenidas exitosamente',
      data: {
        ...revenueStats,
        revenueByMethod
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getClientStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientStats = await queryOne<any>(`
      SELECT 
        COUNT(DISTINCT c.id) as totalClients,
        COUNT(DISTINCT CASE WHEN u.isActive = 1 THEN c.id END) as activeClients,
        COUNT(DISTINCT CASE WHEN u.isActive = 0 THEN c.id END) as inactiveClients,
        COUNT(DISTINCT CASE WHEN c.createdAt >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN c.id END) as newClientsThisMonth
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
    `);

    // Clientes más activos
    const topClients = await query<any>(`
      SELECT 
        c.id,
        c.clientCode,
        uc.firstName,
        uc.lastName,
        uc.email,
        COUNT(a.id) as totalAppointments,
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completedAppointments,
        COALESCE(SUM(CASE WHEN p.status = 'PAID' THEN p.amount ELSE 0 END), 0) as totalSpent
      FROM clients c
      INNER JOIN users uc ON c.userId = uc.id
      LEFT JOIN appointments a ON c.id = a.clientId
      LEFT JOIN payments p ON c.id = p.clientId
      WHERE uc.isActive = 1
      GROUP BY c.id
      HAVING totalAppointments > 0
      ORDER BY completedAppointments DESC, totalSpent DESC
      LIMIT 10
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas de clientes obtenidas exitosamente',
      data: {
        ...clientStats,
        topClients
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getEmployeeStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const employeeStats = await query<any>(`
      SELECT 
        e.id,
        e.position,
        ue.firstName,
        ue.lastName,
        COUNT(a.id) as totalAppointments,
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completedAppointments,
        COUNT(CASE WHEN DATE(a.date) = CURDATE() THEN 1 END) as todayAppointments,
        COALESCE(AVG(CASE WHEN a.status = 'COMPLETED' THEN 5 ELSE NULL END), 0) as avgRating
      FROM employees e
      INNER JOIN users ue ON e.userId = ue.id
      LEFT JOIN appointments a ON e.id = a.employeeId
      WHERE e.isActive = 1
      GROUP BY e.id
      ORDER BY completedAppointments DESC
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas de empleados obtenidas exitosamente',
      data: employeeStats
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
