import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/auth';

export const getTreatments = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const category = req.query.category as string;
    const status = req.query.status as string;
    const minPrice = req.query.minPrice as string;
    const maxPrice = req.query.maxPrice as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    // Filtrar por empresa (obligatorio para usuarios no master)
    if (!req.user?.isMaster) {
      if (!req.user?.companies?.current?.id) {
        throw new AppError('Usuario no tiene empresa asignada', 403);
      }
      whereClause += ` AND t.companyId = ?`;
      params.push(req.user.companies.current.id);
    } else if (req.companyId) {
      // Si el master ha seleccionado una empresa específica
      whereClause += ` AND t.companyId = ?`;
      params.push(req.companyId);
    }

    if (search) {
      whereClause += ` AND (t.name LIKE ? OR t.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (category) {
      whereClause += ` AND t.category = ?`;
      params.push(category);
    }

    if (status !== undefined) {
      whereClause += ` AND t.isActive = ?`;
      params.push(status === 'active' ? 1 : 0);
    }

    if (minPrice) {
      whereClause += ` AND t.price >= ?`;
      params.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      whereClause += ` AND t.price <= ?`;
      params.push(parseFloat(maxPrice));
    }

    // Obtener total de registros
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total FROM treatments t ${whereClause}
    `, params);

    const total = totalResult?.total || 0;

    // Obtener tratamientos paginados
    const treatments = await query<any>(`
      SELECT 
        t.*,
        COUNT(DISTINCT at.appointmentId) as totalAppointments,
        AVG(CASE WHEN a.status = 'COMPLETED' THEN 5 ELSE NULL END) as avgRating,
        COUNT(DISTINCT CASE WHEN a.status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS') THEN at.appointmentId END) as activeAppointments,
        CASE WHEN COUNT(DISTINCT at.appointmentId) = 0 THEN 1 ELSE 0 END as canDelete
      FROM treatments t
      LEFT JOIN appointment_treatments at ON t.id = at.treatmentId
      LEFT JOIN appointments a ON at.appointmentId = a.id
      ${whereClause}
      GROUP BY t.id
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const response: PaginatedResponse = {
      success: true,
      data: treatments,
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

export const getTreatmentById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const treatment = await queryOne<any>(`
      SELECT 
        t.*,
        COUNT(DISTINCT at.appointmentId) as totalAppointments,
        COUNT(DISTINCT CASE WHEN a.status = 'COMPLETED' THEN at.appointmentId END) as completedAppointments,
        SUM(CASE WHEN a.status = 'COMPLETED' THEN at.price * at.quantity ELSE 0 END) as totalRevenue
      FROM treatments t
      LEFT JOIN appointment_treatments at ON t.id = at.treatmentId
      LEFT JOIN appointments a ON at.appointmentId = a.id
      WHERE t.id = ?
      GROUP BY t.id
    `, [id]);

    if (!treatment) {
      throw new AppError('Tratamiento no encontrado', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Tratamiento obtenido exitosamente',
      data: treatment
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createTreatment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      duration,
      price,
      category,
      supplies
    } = req.body;

    if (!name || !duration || !price || !category) {
      throw new AppError('Nombre, duración, precio y categoría son requeridos', 400);
    }

    if (duration <= 0) {
      throw new AppError('La duración debe ser mayor a 0 minutos', 400);
    }

    if (price <= 0) {
      throw new AppError('El precio debe ser mayor a 0', 400);
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
      console.error('❌ No se puede determinar companyId para tratamiento:', {
        isMaster: req.user?.isMaster,
        reqCompanyId: req.companyId,
        companiesCurrent: req.user?.companies?.current?.id,
        currentCompanyId: req.user?.currentCompanyId,
        availableCompanies: req.user?.companies?.available?.ids?.length || 0,
        user: req.user
      });
      throw new AppError('No se puede determinar la empresa para el tratamiento. El usuario master debe tener al menos una empresa disponible.', 400);
    }

    // Verificar si ya existe un tratamiento con el mismo nombre en la empresa
    const existingTreatment = await queryOne(`
      SELECT id FROM treatments WHERE name = ? AND companyId = ? AND isActive = 1
    `, [name, companyId]);

    if (existingTreatment) {
      throw new AppError('Ya existe un tratamiento activo con ese nombre en tu empresa', 400);
    }

    const treatmentId = generateId();
    
    await query(`
      INSERT INTO treatments (
        id, companyId, name, description, duration, price, category, supplies, isActive, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      treatmentId, companyId, name, description || null, duration, price, category,
      supplies ? JSON.stringify(supplies) : null
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Tratamiento creado exitosamente',
      data: {
        id: treatmentId,
        name,
        price,
        duration,
        category
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateTreatment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      duration,
      price,
      category,
      supplies
    } = req.body;

    // Verificar que el tratamiento existe
    const treatment = await queryOne<any>(`
      SELECT * FROM treatments WHERE id = ?
    `, [id]);

    if (!treatment) {
      throw new AppError('Tratamiento no encontrado', 404);
    }

    if (duration && duration <= 0) {
      throw new AppError('La duración debe ser mayor a 0 minutos', 400);
    }

    if (price && price <= 0) {
      throw new AppError('El precio debe ser mayor a 0', 400);
    }

    // Verificar si ya existe otro tratamiento con el mismo nombre
    if (name && name !== treatment.name) {
      const existingTreatment = await queryOne(`
        SELECT id FROM treatments WHERE name = ? AND id != ? AND isActive = 1
      `, [name, id]);

      if (existingTreatment) {
        throw new AppError('Ya existe un tratamiento activo con ese nombre', 400);
      }
    }

    await query(`
      UPDATE treatments 
      SET name = ?, description = ?, duration = ?, price = ?, category = ?, 
          supplies = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      name || treatment.name,
      description !== undefined ? description : treatment.description,
      duration || treatment.duration,
      price || treatment.price,
      category || treatment.category,
      supplies ? JSON.stringify(supplies) : treatment.supplies,
      id
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Tratamiento actualizado exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const toggleTreatmentStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const treatment = await queryOne<any>(`
      SELECT * FROM treatments WHERE id = ?
    `, [id]);

    if (!treatment) {
      throw new AppError('Tratamiento no encontrado', 404);
    }

    const newStatus = !treatment.isActive;
    
    await query(`
      UPDATE treatments SET isActive = ?, updatedAt = NOW()
      WHERE id = ?
    `, [newStatus ? 1 : 0, id]);

    const response: ApiResponse = {
      success: true,
      message: `Tratamiento ${newStatus ? 'activado' : 'desactivado'} exitosamente`
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteTreatment = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const treatment = await queryOne<any>(`
      SELECT * FROM treatments WHERE id = ?
    `, [id]);

    if (!treatment) {
      throw new AppError('Tratamiento no encontrado', 404);
    }

    // Verificar si tiene citas asociadas
    const hasAppointments = await queryOne<any>(`
      SELECT COUNT(*) as count FROM appointment_treatments WHERE treatmentId = ?
    `, [id]);

    if (hasAppointments && hasAppointments.count > 0) {
      throw new AppError('No se puede eliminar un tratamiento con citas registradas', 400);
    }

    await query(`DELETE FROM treatments WHERE id = ?`, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Tratamiento eliminado exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getTreatmentCategories = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await query<any>(`
      SELECT 
        category,
        COUNT(*) as count,
        AVG(price) as avgPrice,
        MIN(price) as minPrice,
        MAX(price) as maxPrice
      FROM treatments 
      WHERE isActive = 1
      GROUP BY category
      ORDER BY category
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: categories
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getTreatmentStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await queryOne<any>(`
      SELECT 
        COUNT(*) as totalTreatments,
        COUNT(CASE WHEN isActive = 1 THEN 1 END) as activeTreatments,
        COUNT(CASE WHEN isActive = 0 THEN 1 END) as inactiveTreatments,
        AVG(price) as avgPrice,
        MIN(price) as minPrice,
        MAX(price) as maxPrice,
        AVG(duration) as avgDuration
      FROM treatments
    `);

    const popularTreatments = await query<any>(`
      SELECT 
        t.id,
        t.name,
        t.price,
        COUNT(at.appointmentId) as appointmentCount,
        SUM(CASE WHEN a.status = 'COMPLETED' THEN at.price * at.quantity ELSE 0 END) as revenue
      FROM treatments t
      LEFT JOIN appointment_treatments at ON t.id = at.treatmentId
      LEFT JOIN appointments a ON at.appointmentId = a.id
      WHERE t.isActive = 1
      GROUP BY t.id
      ORDER BY appointmentCount DESC
      LIMIT 5
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        ...stats,
        popularTreatments
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};
