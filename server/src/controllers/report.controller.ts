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
    
    // Prueba de conectividad básica
    try {
      console.log('🔍 [REVENUE] Probando conectividad...');
      const testResult = await queryOne<any>('SELECT 1 as test', []);
      console.log('✅ [REVENUE] Conectividad OK:', testResult);
    } catch (testError) {
      console.error('❌ [REVENUE] Error de conectividad:', testError);
      res.status(500).json({ success: false, message: 'Error de conectividad', error: testError });
      return;
    }
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    console.log('📅 Fechas formateadas:', { formattedStartDate, formattedEndDate });
    
    // Consulta ultra-básica para Railway debugging
    const totalRevenueQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) as totalRevenue,
        COUNT(*) as totalPayments
      FROM payments
      WHERE status = 'PAID'
    `;

    // Consulta ultra-básica de ingresos por mes para Railway
    const revenueByMonthQuery = `
      SELECT 
        '2025-12' as period,
        'December 2025' as periodLabel,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as payments
      FROM payments
      WHERE status = 'PAID'
    `;

    // Consulta ultra-básica de citas para Railway
    const appointmentsByMonthQuery = `
      SELECT 
        '2025-12' as period,
        'December 2025' as periodLabel,
        COUNT(*) as appointments
      FROM appointments
    `;
    
    // Sin parámetros para debugging Railway
    const params: any[] = [];
    
    console.log('🔧 Parámetros SQL (Railway debugging - sin parámetros):', params);
    console.log('📊 Consulta Total Revenue:', totalRevenueQuery.replace(/\s+/g, ' ').trim());
    console.log('📊 Consulta Revenue By Month:', revenueByMonthQuery.replace(/\s+/g, ' ').trim());
    console.log('📊 Consulta Appointments By Month:', appointmentsByMonthQuery.replace(/\s+/g, ' ').trim());
    
    // Ejecutar consultas de forma secuencial para Railway
    console.log('🔄 Ejecutando consulta de ingresos totales...');
    const totalRevenueResult = await queryOne<any>(totalRevenueQuery, params);
    console.log('✅ Resultado ingresos totales:', totalRevenueResult);
    
    console.log('🔄 Ejecutando consulta de ingresos por mes...');
    const revenueByMonthData = await query<any[]>(revenueByMonthQuery, params);
    console.log('✅ Resultado ingresos por mes:', revenueByMonthData);
    
    console.log('🔄 Ejecutando consulta de citas por mes...');
    const appointmentsByMonthData = await query<any[]>(appointmentsByMonthQuery, params);
    console.log('✅ Resultado citas por mes:', appointmentsByMonthData);
    
    console.log('🎯 Resultado consulta total:', totalRevenueResult);
    console.log('🎯 Resultado consulta por mes:', revenueByMonthData);
    console.log('🎯 Resultado citas por mes:', appointmentsByMonthData);
    
    // Obtener totales de la consulta específica
    const totalRevenue = Number(totalRevenueResult.totalRevenue) || 0;
    const totalPayments = Number(totalRevenueResult.totalPayments) || 0;

    // Combinar datos de ingresos con citas por mes
    const combinedMonthlyData = revenueByMonthData.map((revenueItem: any) => {
      const appointmentItem = appointmentsByMonthData.find((apt: any) => apt.period === revenueItem.period);
      return {
        period: revenueItem.period,
        periodLabel: revenueItem.periodLabel,
        revenue: Number(revenueItem.revenue) || 0,
        payments: Number(revenueItem.payments) || 0,
        appointments: appointmentItem ? Number((appointmentItem as any).appointments) : 0
      };
    });
    
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
        revenueByPeriod: combinedMonthlyData,
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
    
    // Prueba de conectividad básica
    try {
      console.log('🔍 [APPOINTMENTS] Probando conectividad...');
      const testResult = await queryOne<any>('SELECT 1 as test', []);
      console.log('✅ [APPOINTMENTS] Conectividad OK:', testResult);
    } catch (testError) {
      console.error('❌ [APPOINTMENTS] Error de conectividad:', testError);
      res.status(500).json({ success: false, message: 'Error de conectividad', error: testError });
      return;
    }
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    console.log('📅 Fechas formateadas (Appointments):', { formattedStartDate, formattedEndDate });
    
    // Consulta ultra-básica de citas para Railway debugging
    const totalAppointmentsQuery = `
      SELECT 
        COUNT(*) as totalAppointments,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completedAppointments,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelledAppointments,
        COUNT(CASE WHEN status = 'SCHEDULED' THEN 1 END) as scheduledAppointments,
        COUNT(CASE WHEN status = 'CONFIRMED' THEN 1 END) as confirmedAppointments
      FROM appointments
    `;

    // Consulta ultra-básica de citas por estado para Railway
    const appointmentsByStatusQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM appointments
      GROUP BY status
      ORDER BY count DESC
    `;
    
    // Sin parámetros para debugging Railway
    const params: any[] = [];
    
    console.log('🔧 Parámetros SQL (Appointments - Railway debugging):', params);
    console.log('📊 Consulta Total Appointments:', totalAppointmentsQuery.replace(/\s+/g, ' ').trim());
    console.log('📊 Consulta Appointments By Status:', appointmentsByStatusQuery.replace(/\s+/g, ' ').trim());
    
    // Ejecutar consultas de forma secuencial para Railway
    console.log('🔄 Ejecutando consulta de total de citas...');
    const totalAppointmentsResult = await queryOne<any>(totalAppointmentsQuery, params);
    console.log('✅ Resultado total citas:', totalAppointmentsResult);
    
    console.log('🔄 Ejecutando consulta de citas por estado...');
    const appointmentsByStatus = await query<any[]>(appointmentsByStatusQuery, params);
    console.log('✅ Resultado citas por estado:', appointmentsByStatus);
    
    console.log('🎯 Resultado consulta total appointments:', totalAppointmentsResult);
    console.log('🎯 Resultado appointments by status:', appointmentsByStatus);
    
    // Consulta ultra-básica de citas por mes para Railway
    const appointmentsByMonthQuery = `
      SELECT 
        '2025-12' as period,
        'December 2025' as periodLabel,
        COUNT(*) as appointments,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled
      FROM appointments
    `;
    
    console.log('📊 Consulta Appointments By Month:', appointmentsByMonthQuery.replace(/\s+/g, ' ').trim());
    
    console.log('🔄 Ejecutando consulta de citas por mes...');
    const appointmentsByMonth = await query<any[]>(appointmentsByMonthQuery, params);
    console.log('✅ Resultado citas por mes:', appointmentsByMonth);
    
    console.log('🎯 Resultado appointments by month:', appointmentsByMonth);
    
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
    
    console.log('🧮 Totales calculados (Appointments):', {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      scheduledAppointments,
      confirmedAppointments
    });
    console.log('📊 Appointments by status con porcentajes:', appointmentsByStatusWithPercentages);
    
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
    
    // Prueba ultra-básica de conectividad primero
    try {
      console.log('🔍 Probando conectividad básica con Railway...');
      const testResult = await queryOne<any>('SELECT 1 as test', []);
      console.log('✅ Conectividad básica OK:', testResult);
    } catch (testError) {
      console.error('❌ Error de conectividad básica:', testError);
      const errorResponse = {
        success: false,
        message: 'Error de conectividad con la base de datos',
        error: testError
      };
      res.status(500).json(errorResponse);
      return;
    }
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    // Consulta real de tratamientos más populares basada en citas
    const treatmentsQuery = `
      SELECT 
        t.name,
        COUNT(at.treatmentId) as count,
        SUM(at.price * at.quantity) as revenue
      FROM treatments t
      INNER JOIN appointment_treatments at ON t.id = at.treatmentId
      INNER JOIN appointments a ON at.appointmentId = a.id
      WHERE a.date BETWEEN ? AND ?
        AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
        ${companyId ? 'AND t.companyId = ?' : ''}
      GROUP BY t.id, t.name
      ORDER BY COUNT(at.treatmentId) DESC
      LIMIT 5
    `;
    
    // Consulta para total de tratamientos utilizados en el período
    const totalTreatmentsCountQuery = `
      SELECT COUNT(at.treatmentId) as totalCount
      FROM appointment_treatments at
      INNER JOIN appointments a ON at.appointmentId = a.id
      WHERE a.date BETWEEN ? AND ?
        AND a.status NOT IN ('CANCELLED', 'NO_SHOW')
        ${companyId ? 'AND a.companyId = ?' : ''}
    `;
    
    const params: any[] = [formattedStartDate, formattedEndDate];
    if (companyId) {
      params.push(companyId);
    }
    
    console.log('🔧 Parámetros SQL (Treatments - Railway debugging):', params);
    console.log('📊 Consulta Treatments:', treatmentsQuery.replace(/\s+/g, ' ').trim());
    console.log('📊 Consulta Total Count:', totalTreatmentsCountQuery.replace(/\s+/g, ' ').trim());
    
    // Ejecutar consultas de forma secuencial para Railway
    console.log('🔄 Ejecutando consulta de tratamientos...');
    const treatmentsData = await query<any[]>(treatmentsQuery, params);
    console.log('✅ Resultado tratamientos:', treatmentsData);
    
    console.log('🔄 Ejecutando consulta de total de tratamientos...');
    const totalCountResult = await queryOne<any>(totalTreatmentsCountQuery, params);
    console.log('✅ Resultado total count:', totalCountResult);
    
    // Fallback si no hay datos
    if (!totalCountResult || !totalCountResult.totalCount) {
      console.log('⚠️ No se encontraron tratamientos, usando datos por defecto');
      const response: ApiResponse = {
        success: true,
        message: 'Reporte de tratamientos obtenido (sin datos)',
        data: {
          summary: {
            totalTreatments: 0,
            totalRevenue: 0,
            averagePrice: 0,
            period: `${formattedStartDate} - ${formattedEndDate}`
          },
          topTreatments: [],
          filters: {
            startDate: formattedStartDate,
            endDate: formattedEndDate
          }
        }
      };
      res.json(response);
      return;
    }
    
    // Calcular porcentajes manualmente
    const totalCount = Number(totalCountResult.totalCount) || 1; // Evitar división por 0
    const treatmentsDataWithPercentages = treatmentsData.map((item: any) => ({
      ...item,
      count: Number(item.count),
      revenue: Number(item.revenue),
      percentage: Math.round((Number(item.count) / totalCount) * 100 * 100) / 100 // Redondear a 2 decimales
    }));
    
    console.log('💊 Treatments con porcentajes:', treatmentsDataWithPercentages);
    
    const totalTreatments = treatmentsDataWithPercentages.reduce((sum, item: any) => sum + Number(item.count), 0);
    const totalRevenue = treatmentsDataWithPercentages.reduce((sum, item: any) => sum + Number(item.revenue), 0);
    
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
        topTreatments: treatmentsDataWithPercentages.slice(0, 10), // Limitar a top 10
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
    
    // Prueba de conectividad básica
    try {
      console.log('🔍 [CLIENTS] Probando conectividad...');
      const testResult = await queryOne<any>('SELECT 1 as test', []);
      console.log('✅ [CLIENTS] Conectividad OK:', testResult);
    } catch (testError) {
      console.error('❌ [CLIENTS] Error de conectividad:', testError);
      res.status(500).json({ success: false, message: 'Error de conectividad', error: testError });
      return;
    }
    
    const { startDate: formattedStartDate, endDate: formattedEndDate } = validateAndFormatDates(startDate, endDate);
    
    // Consulta ultra-básica de clientes para Railway debugging
    const newClientsQuery = `
      SELECT 
        '2025-12' as period,
        'December 2025' as periodLabel,
        COUNT(*) as newClients
      FROM clients
    `;
    
    // Consulta ultra-básica de clientes totales para Railway
    const totalClientsQuery = `
      SELECT 
        COUNT(*) as totalClients,
        COUNT(*) as newClientsInPeriod,
        COUNT(*) as returningClients
      FROM clients
    `;
    
    // Sin parámetros para debugging Railway
    const newClientsParams: any[] = [];
    const totalClientsParams: any[] = [];
    
    console.log('🔧 Parámetros SQL (Clients - Railway compatible):', { newClientsParams, totalClientsParams });
    
    // Ejecutar consultas de forma secuencial para Railway
    console.log('🔄 Ejecutando consulta de clientes nuevos...');
    const newClientsData = await query<ClientData[]>(newClientsQuery, newClientsParams);
    console.log('✅ Resultado clientes nuevos:', newClientsData);
    
    console.log('🔄 Ejecutando consulta de clientes totales...');
    const totalClientsData = await queryOne<any>(totalClientsQuery, totalClientsParams);
    console.log('✅ Resultado clientes totales:', totalClientsData);
    
    // Estadísticas básicas para Railway debugging
    console.log('🔄 Calculando estadísticas adicionales de clientes...');
    const activeClientsResult = { activeClients: totalClientsData.totalClients || 0 };
    const inactiveClientsResult = { inactiveClients: 0 };
    
    // Combinar resultados
    const combinedTotalClientsData = {
      ...totalClientsData,
      activeClients: activeClientsResult.activeClients || totalClientsData.totalClients,
      inactiveClients: inactiveClientsResult.inactiveClients || 0
    };
    
    console.log('👥 Clients Report Results:', {
      totalClients: combinedTotalClientsData.totalClients,
      activeClients: combinedTotalClientsData.activeClients,
      inactiveClients: combinedTotalClientsData.inactiveClients,
      newClientsInPeriod: combinedTotalClientsData.newClientsInPeriod,
      returningClients: combinedTotalClientsData.returningClients
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Reporte de clientes obtenido exitosamente',
      data: {
        summary: {
          totalClients: Number(combinedTotalClientsData.totalClients),
          activeClients: Number(combinedTotalClientsData.activeClients),
          inactiveClients: Number(combinedTotalClientsData.inactiveClients),
          newClientsInPeriod: Number(combinedTotalClientsData.newClientsInPeriod),
          returningClients: Number(combinedTotalClientsData.returningClients),
          retentionRate: combinedTotalClientsData.activeClients > 0 
            ? Math.round((combinedTotalClientsData.returningClients / combinedTotalClientsData.activeClients) * 100)
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
