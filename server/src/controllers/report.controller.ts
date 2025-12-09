import { Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse } from '../types';

// Interfaces para reportes
interface ReportFilters {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}

interface RevenueData {
  period: string;
  revenue: number;
  appointments: number;
}

interface TreatmentData {
  name: string;
  count: number;
  revenue: number;
  percentage: number;
}

interface ClientData {
  period: string;
  newClients: number;
  totalClients: number;
  returningClients: number;
}

// Helper para obtener fechas del mes actual
const getCurrentMonthDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
  
  return { startDate, endDate };
};

// Helper para validar y formatear fechas
const validateAndFormatDates = (startDate?: string, endDate?: string) => {
  let formattedStartDate: string;
  let formattedEndDate: string;
  
  if (!startDate || !endDate) {
    // Si no se proporcionan fechas, usar el mes actual
    const currentMonth = getCurrentMonthDates();
    formattedStartDate = currentMonth.startDate;
    formattedEndDate = currentMonth.endDate;
  } else {
    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
    }
    formattedStartDate = startDate;
    formattedEndDate = endDate;
  }
  
  return { startDate: formattedStartDate, endDate: formattedEndDate };
};

// Reporte de ingresos
export const getRevenueReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query as ReportFilters;
    const companyId = req.user?.currentCompanyId;
    
    console.log('🔍 Revenue Report - Parámetros:', { startDate, endDate, groupBy, companyId });
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    // Consulta de ingresos totales en el período
    const totalRevenueQuery = `
      SELECT 
        COALESCE(SUM(p.amount), 0) as totalRevenue,
        COUNT(p.id) as totalPayments
      FROM payments p
      INNER JOIN clients c ON p.clientId = c.id
      WHERE p.status = 'PAID'
        AND DATE(p.paidDate) BETWEEN ? AND ?
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
    `;

    // Consulta de ingresos agrupados por mes
    const revenueByMonthQuery = `
      SELECT 
        DATE_FORMAT(p.paidDate, '%Y-%m') as period,
        DATE_FORMAT(p.paidDate, '%M %Y') as periodLabel,
        SUM(p.amount) as revenue,
        COUNT(p.id) as payments
      FROM payments p
      INNER JOIN clients c ON p.clientId = c.id
      WHERE p.status = 'PAID'
        AND DATE(p.paidDate) BETWEEN ? AND ?
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
      GROUP BY DATE_FORMAT(p.paidDate, '%Y-%m')
      ORDER BY period DESC
    `;
    
    const params = companyId 
      ? [formattedStartDate, formattedEndDate, companyId]
      : [formattedStartDate, formattedEndDate];
    
    // Ejecutar ambas consultas
    const [totalRevenueResult, revenueByMonthData] = await Promise.all([
      queryOne<any>(totalRevenueQuery, params),
      query<any[]>(revenueByMonthQuery, params)
    ]);
    
    // Obtener totales de la consulta específica
    const totalRevenue = Number(totalRevenueResult.totalRevenue) || 0;
    const totalPayments = Number(totalRevenueResult.totalPayments) || 0;
    
    console.log('💰 Revenue Report Results:', {
      totalRevenue,
      totalPayments,
      periods: revenueByMonthData.length,
      dateRange: `${formattedStartDate} to ${formattedEndDate}`
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Reporte de ingresos obtenido exitosamente',
      data: {
        summary: {
          totalRevenue,
          totalPayments,
          averageRevenue: totalPayments > 0 ? totalRevenue / totalPayments : 0,
          period: `${formattedStartDate} - ${formattedEndDate}`
        },
        revenueByPeriod: revenueByMonthData,
        filters: {
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          groupBy
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error en reporte de ingresos:', error);
    next(error);
  }
};

// Reporte de citas
export const getAppointmentsReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query as ReportFilters;
    const companyId = req.user?.currentCompanyId;
    
    console.log('🔍 Appointments Report - Parámetros:', { startDate, endDate, companyId });
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    // Consulta de total de citas en el período
    const totalAppointmentsQuery = `
      SELECT 
        COUNT(*) as totalAppointments,
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completedAppointments,
        COUNT(CASE WHEN a.status = 'CANCELLED' THEN 1 END) as cancelledAppointments,
        COUNT(CASE WHEN a.status = 'SCHEDULED' THEN 1 END) as scheduledAppointments,
        COUNT(CASE WHEN a.status = 'CONFIRMED' THEN 1 END) as confirmedAppointments
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      WHERE DATE(a.date) BETWEEN ? AND ?
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
    `;

    // Consulta de citas por estado con porcentajes
    const appointmentsByStatusQuery = `
      SELECT 
        a.status,
        COUNT(*) as count
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      WHERE DATE(a.date) BETWEEN ? AND ?
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
      GROUP BY a.status
      ORDER BY count DESC
    `;
    
    const params = companyId 
      ? [formattedStartDate, formattedEndDate, companyId]
      : [formattedStartDate, formattedEndDate];
    
    const [totalAppointmentsResult, appointmentsByStatus] = await Promise.all([
      queryOne<any>(totalAppointmentsQuery, params),
      query<any[]>(appointmentsByStatusQuery, params)
    ]);
    
    // Consulta de citas por mes
    const appointmentsByMonthQuery = `
      SELECT 
        DATE_FORMAT(a.date, '%Y-%m') as period,
        DATE_FORMAT(a.date, '%M %Y') as periodLabel,
        COUNT(*) as appointments,
        COUNT(CASE WHEN a.status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN a.status = 'CANCELLED' THEN 1 END) as cancelled
      FROM appointments a
      INNER JOIN clients c ON a.clientId = c.id
      WHERE DATE(a.date) BETWEEN ? AND ?
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
      GROUP BY DATE_FORMAT(a.date, '%Y-%m')
      ORDER BY period DESC
    `;
    
    const appointmentsByMonth = await query<any[]>(appointmentsByMonthQuery, params);
    
    // Obtener totales de la consulta específica
    const totalAppointments = Number(totalAppointmentsResult.totalAppointments) || 0;
    const completedAppointments = Number(totalAppointmentsResult.completedAppointments) || 0;
    const cancelledAppointments = Number(totalAppointmentsResult.cancelledAppointments) || 0;
    const scheduledAppointments = Number(totalAppointmentsResult.scheduledAppointments) || 0;
    const confirmedAppointments = Number(totalAppointmentsResult.confirmedAppointments) || 0;

    // Calcular porcentajes para appointmentsByStatus
    const appointmentsByStatusWithPercentages = appointmentsByStatus.map((item: any) => ({
      ...item,
      count: Number(item.count),
      percentage: totalAppointments > 0 ? Math.round((Number(item.count) / totalAppointments) * 100) : 0
    }));
    
    console.log('📅 Appointments Report Results:', {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      scheduledAppointments,
      confirmedAppointments,
      statusBreakdown: appointmentsByStatus.length,
      monthlyData: appointmentsByMonth.length,
      dateRange: `${formattedStartDate} to ${formattedEndDate}`
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Reporte de citas obtenido exitosamente',
      data: {
        summary: {
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          scheduledAppointments,
          confirmedAppointments,
          period: `${formattedStartDate} - ${formattedEndDate}`
        },
        appointmentsByStatus: appointmentsByStatusWithPercentages,
        appointmentsByMonth,
        filters: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error en reporte de citas:', error);
    next(error);
  }
};

// Reporte de tratamientos
export const getTreatmentsReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query as ReportFilters;
    const companyId = req.user?.currentCompanyId;
    
    console.log('🔍 Treatments Report - Parámetros:', { startDate, endDate, companyId });
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    // Consulta de tratamientos populares
    const treatmentsQuery = `
      SELECT 
        t.name,
        COUNT(at.treatmentId) as count,
        SUM(at.price) as revenue,
        ROUND((COUNT(at.treatmentId) * 100.0 / (
          SELECT COUNT(*) FROM appointment_treatments at2
          INNER JOIN appointments a2 ON at2.appointmentId = a2.id
          INNER JOIN clients c2 ON a2.clientId = c2.id
          WHERE DATE(a2.date) BETWEEN ? AND ?
          ${companyId ? 'AND (c2.companyId = ? OR c2.companyId IS NULL)' : ''}
        )), 2) as percentage
      FROM treatments t
      INNER JOIN appointment_treatments at ON t.id = at.treatmentId
      INNER JOIN appointments a ON at.appointmentId = a.id
      INNER JOIN clients c ON a.clientId = c.id
      WHERE DATE(a.date) BETWEEN ? AND ?
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
      GROUP BY t.id, t.name
      ORDER BY count DESC
      LIMIT 10
    `;
    
    const params = companyId 
      ? [formattedStartDate, formattedEndDate, companyId, formattedStartDate, formattedEndDate, companyId]
      : [formattedStartDate, formattedEndDate, formattedStartDate, formattedEndDate];
    
    const treatmentsData = await query<TreatmentData[]>(treatmentsQuery, params);
    
    const totalTreatments = treatmentsData.reduce((sum, item: any) => sum + Number(item.count), 0);
    const totalRevenue = treatmentsData.reduce((sum, item: any) => sum + Number(item.revenue), 0);
    
    console.log('💊 Treatments Report Results:', {
      totalTreatments,
      totalRevenue,
      uniqueTreatments: treatmentsData.length
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Reporte de tratamientos obtenido exitosamente',
      data: {
        summary: {
          totalTreatments,
          totalRevenue,
          averagePrice: totalTreatments > 0 ? totalRevenue / totalTreatments : 0,
          period: `${formattedStartDate} - ${formattedEndDate}`
        },
        topTreatments: treatmentsData,
        filters: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error en reporte de tratamientos:', error);
    next(error);
  }
};

// Reporte de clientes
export const getClientsReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query as ReportFilters;
    const companyId = req.user?.currentCompanyId;
    
    console.log('🔍 Clients Report - Parámetros:', { startDate, endDate, companyId });
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    // Consulta de clientes nuevos por período
    const newClientsQuery = `
      SELECT 
        DATE_FORMAT(c.createdAt, '%Y-%m') as period,
        DATE_FORMAT(c.createdAt, '%M %Y') as periodLabel,
        COUNT(*) as newClients
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
      WHERE DATE(c.createdAt) BETWEEN ? AND ?
        AND u.isActive = 1
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
      GROUP BY DATE_FORMAT(c.createdAt, '%Y-%m')
      ORDER BY period DESC
    `;
    
    // Consulta de clientes totales
    const totalClientsQuery = `
      SELECT 
        COUNT(*) as totalClients,
        COUNT(CASE WHEN DATE(c.createdAt) BETWEEN ? AND ? THEN 1 END) as newClientsInPeriod,
        COUNT(CASE WHEN DATE(c.createdAt) < ? THEN 1 END) as returningClients
      FROM clients c
      INNER JOIN users u ON c.userId = u.id
      WHERE u.isActive = 1
        ${companyId ? 'AND (c.companyId = ? OR c.companyId IS NULL)' : ''}
    `;
    
    const newClientsParams = companyId 
      ? [formattedStartDate, formattedEndDate, companyId]
      : [formattedStartDate, formattedEndDate];
    
    const totalClientsParams = companyId 
      ? [formattedStartDate, formattedEndDate, formattedStartDate, companyId]
      : [formattedStartDate, formattedEndDate, formattedStartDate];
    
    const [newClientsData, totalClientsData] = await Promise.all([
      query<ClientData[]>(newClientsQuery, newClientsParams),
      queryOne<any>(totalClientsQuery, totalClientsParams)
    ]);
    
    console.log('👥 Clients Report Results:', {
      totalClients: totalClientsData.totalClients,
      newClientsInPeriod: totalClientsData.newClientsInPeriod,
      returningClients: totalClientsData.returningClients
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Reporte de clientes obtenido exitosamente',
      data: {
        summary: {
          totalClients: Number(totalClientsData.totalClients),
          newClientsInPeriod: Number(totalClientsData.newClientsInPeriod),
          returningClients: Number(totalClientsData.returningClients),
          retentionRate: totalClientsData.totalClients > 0 
            ? Math.round((totalClientsData.returningClients / totalClientsData.totalClients) * 100)
            : 0,
          period: `${formattedStartDate} - ${formattedEndDate}`
        },
        newClientsByPeriod: newClientsData,
        filters: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error en reporte de clientes:', error);
    next(error);
  }
};

// Reporte de dashboard consolidado
export const getDashboardReport = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query as ReportFilters;
    const companyId = req.user?.currentCompanyId;
    
    console.log('🔍 Dashboard Report - Parámetros:', { startDate, endDate, companyId });
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    // Ejecutar todos los reportes en paralelo
    const [revenueResult, appointmentsResult, treatmentsResult, clientsResult] = await Promise.allSettled([
      getRevenueReport({ ...req, query: { startDate: formattedStartDate, endDate: formattedEndDate } } as any, {} as any, () => {}),
      getAppointmentsReport({ ...req, query: { startDate: formattedStartDate, endDate: formattedEndDate } } as any, {} as any, () => {}),
      getTreatmentsReport({ ...req, query: { startDate: formattedStartDate, endDate: formattedEndDate } } as any, {} as any, () => {}),
      getClientsReport({ ...req, query: { startDate: formattedStartDate, endDate: formattedEndDate } } as any, {} as any, () => {})
    ]);
    
    console.log('📊 Dashboard Report - Consolidando resultados...');
    
    const response: ApiResponse = {
      success: true,
      message: 'Reporte de dashboard obtenido exitosamente',
      data: {
        period: `${formattedStartDate} - ${formattedEndDate}`,
        revenue: revenueResult.status === 'fulfilled' ? revenueResult.value : null,
        appointments: appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : null,
        treatments: treatmentsResult.status === 'fulfilled' ? treatmentsResult.value : null,
        clients: clientsResult.status === 'fulfilled' ? clientsResult.value : null,
        filters: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error en reporte de dashboard:', error);
    next(error);
  }
};
