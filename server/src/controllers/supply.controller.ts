import { Response, NextFunction } from 'express';
import { query, queryOne } from '../config/database';
import { AuthenticatedRequest, ApiResponse, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateId } from '../utils/auth';

export const getSupplies = async (
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
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE s.status != \'DISCONTINUED\'';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (s.name LIKE ? OR s.description LIKE ? OR s.supplier LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      whereClause += ` AND s.category = ?`;
      params.push(category);
    }

    if (status) {
      switch (status) {
        case 'low_stock':
          whereClause += ` AND s.stock <= s.minStock AND s.stock > 0`;
          break;
        case 'out_of_stock':
          whereClause += ` AND s.stock = 0`;
          break;
        case 'normal':
          whereClause += ` AND s.stock > s.minStock`;
          break;
      }
    }

    // Obtener total de registros
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total FROM supplies s ${whereClause}
    `, params);

    const total = totalResult?.total || 0;

    // Obtener todos los suministros sin LIMIT/OFFSET para compatibilidad Railway MySQL
    const allSupplies = await query<any>(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.category,
        s.stock,
        s.minStock,
        s.maxStock,
        s.unitCost as unitPrice,
        s.supplier,
        s.expiryDate as expirationDate,
        s.status,
        s.createdAt,
        s.updatedAt,
        CASE s.status
          WHEN 'ACTIVE' THEN 'normal'
          WHEN 'LOW_STOCK' THEN 'low_stock'
          WHEN 'OUT_OF_STOCK' THEN 'out_of_stock'
          WHEN 'EXPIRED' THEN 'expired'
          ELSE 'normal'
        END as stockStatus,
        CASE 
          WHEN s.expiryDate IS NOT NULL AND s.expiryDate <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1
          ELSE 0
        END as nearExpiration,
        CASE 
          WHEN s.status = 'DISCONTINUED' THEN 0
          ELSE 1
        END as isActive
      FROM supplies s
      ${whereClause}
      ORDER BY s.createdAt DESC
    `, params);

    // Aplicar paginación manual
    const supplies = allSupplies.slice(offset, offset + limit);

    const response: PaginatedResponse = {
      success: true,
      data: supplies,
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

export const getSupplyById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const supply = await queryOne<any>(`
      SELECT 
        s.*,
        CASE 
          WHEN s.stock = 0 THEN 'out_of_stock'
          WHEN s.stock <= s.minStock THEN 'low_stock'
          ELSE 'normal'
        END as stockStatus,
        CASE 
          WHEN s.expirationDate IS NOT NULL AND s.expirationDate <= DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1
          ELSE 0
        END as nearExpiration
      FROM supplies s
      WHERE s.id = ?
    `, [id]);

    if (!supply) {
      throw new AppError('Insumo no encontrado', 404);
    }

    const response: ApiResponse = {
      success: true,
      message: 'Insumo obtenido exitosamente',
      data: supply
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const createSupply = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      description,
      category,
      unit,
      stock,
      minStock,
      maxStock,
      unitPrice,
      supplier,
      expirationDate
    } = req.body;

    if (!name || !category || stock === undefined || minStock === undefined || unitPrice === undefined) {
      throw new AppError('Nombre, categoría, stock, stock mínimo y precio unitario son requeridos', 400);
    }

    if (stock < 0 || minStock < 0 || unitPrice < 0) {
      throw new AppError('Los valores numéricos no pueden ser negativos', 400);
    }

    if (maxStock !== undefined && maxStock < minStock) {
      throw new AppError('El stock máximo no puede ser menor al stock mínimo', 400);
    }

    // Verificar si ya existe un insumo con el mismo nombre
    const existingSupply = await queryOne(`
      SELECT id FROM supplies WHERE name = ? AND status != 'DISCONTINUED'
    `, [name]);

    if (existingSupply) {
      throw new AppError('Ya existe un insumo activo con ese nombre', 400);
    }

    const supplyId = generateId();
    
    // Determinar el status inicial basado en el stock
    let initialStatus = 'ACTIVE';
    if (stock === 0) {
      initialStatus = 'OUT_OF_STOCK';
    } else if (stock <= minStock) {
      initialStatus = 'LOW_STOCK';
    }

    await query(`
      INSERT INTO supplies (
        id, name, description, category, unit, stock, minStock, maxStock, 
        unitCost, supplier, expiryDate, status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      supplyId, name, description || null, category, unit || 'unidad', stock, minStock, 
      maxStock || null, unitPrice, supplier || null, expirationDate || null, initialStatus
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Insumo creado exitosamente',
      data: {
        id: supplyId,
        name,
        category,
        stock,
        unitPrice,
        isActive: true
      }
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateSupply = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      stock,
      minStock,
      maxStock,
      unitPrice,
      supplier,
      expirationDate
    } = req.body;

    // Verificar que el insumo existe
    const supply = await queryOne<any>(`
      SELECT * FROM supplies WHERE id = ?
    `, [id]);

    if (!supply) {
      throw new AppError('Insumo no encontrado', 404);
    }

    if (stock !== undefined && stock < 0) {
      throw new AppError('El stock no puede ser negativo', 400);
    }

    if (minStock !== undefined && minStock < 0) {
      throw new AppError('El stock mínimo no puede ser negativo', 400);
    }

    if (unitPrice !== undefined && unitPrice < 0) {
      throw new AppError('El precio unitario no puede ser negativo', 400);
    }

    if (maxStock !== undefined && minStock !== undefined && maxStock < minStock) {
      throw new AppError('El stock máximo no puede ser menor al stock mínimo', 400);
    }

    // Verificar si ya existe otro insumo con el mismo nombre
    if (name && name !== supply.name) {
      const existingSupply = await queryOne(`
        SELECT id FROM supplies WHERE name = ? AND id != ? AND status != 'DISCONTINUED'
      `, [name, id]);

      if (existingSupply) {
        throw new AppError('Ya existe un insumo activo con ese nombre', 400);
      }
    }

    await query(`
      UPDATE supplies 
      SET name = ?, description = ?, category = ?, stock = ?, minStock = ?, 
          maxStock = ?, unitCost = ?, supplier = ?, expiryDate = ?, updatedAt = NOW()
      WHERE id = ?
    `, [
      name || supply.name,
      description !== undefined ? description : supply.description,
      category || supply.category,
      stock !== undefined ? stock : supply.stock,
      minStock !== undefined ? minStock : supply.minStock,
      maxStock !== undefined ? maxStock : supply.maxStock,
      unitPrice !== undefined ? unitPrice : supply.unitCost,
      supplier !== undefined ? supplier : supply.supplier,
      expirationDate !== undefined ? (expirationDate || null) : supply.expiryDate,
      id
    ]);

    const response: ApiResponse = {
      success: true,
      message: 'Insumo actualizado exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const deleteSupply = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const supply = await queryOne<any>(`
      SELECT * FROM supplies WHERE id = ?
    `, [id]);

    if (!supply) {
      throw new AppError('Insumo no encontrado', 404);
    }

    // Verificar si el insumo está siendo usado en tratamientos
    const isUsedInTreatments = await queryOne<any>(`
      SELECT COUNT(*) as count FROM treatments 
      WHERE supplies LIKE ? AND isActive = 1
    `, [`%"${supply.name}"%`]);

    if (isUsedInTreatments && isUsedInTreatments.count > 0) {
      throw new AppError('No se puede eliminar un insumo que está siendo usado en tratamientos activos', 400);
    }

    await query(`DELETE FROM supplies WHERE id = ?`, [id]);

    const response: ApiResponse = {
      success: true,
      message: 'Insumo eliminado exitosamente'
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { quantity, type, reason, unitCost } = req.body;

    if (!quantity || !type || !['add', 'subtract'].includes(type)) {
      throw new AppError('Cantidad y tipo de movimiento son requeridos', 400);
    }

    if (quantity <= 0) {
      throw new AppError('La cantidad debe ser mayor a 0', 400);
    }

    const supply = await queryOne<any>(`
      SELECT * FROM supplies WHERE id = ?
    `, [id]);

    if (!supply) {
      throw new AppError('Insumo no encontrado', 404);
    }

    let newStock = supply.stock;
    
    if (type === 'add') {
      newStock += quantity;
    } else {
      newStock -= quantity;
      if (newStock < 0) {
        throw new AppError('No hay suficiente stock disponible', 400);
      }
    }

    // Determinar nuevo status basado en el stock
    let newStatus = supply.status;
    if (newStock === 0) {
      newStatus = 'OUT_OF_STOCK';
    } else if (newStock <= supply.minStock) {
      newStatus = 'LOW_STOCK';
    } else {
      newStatus = 'ACTIVE';
    }

    // Actualizar el supply
    await query(`
      UPDATE supplies SET stock = ?, status = ?, updatedAt = NOW() WHERE id = ?
    `, [newStock, newStatus, id]);

    // Registrar el movimiento de inventario
    const movementId = generateId();
    const movementType = type === 'add' ? 'IN' : 'OUT';
    
    await query(`
      INSERT INTO supply_movements (
        id, supplyId, type, quantity, unitCost, reason, createdBy, createdAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      movementId, id, movementType, quantity, supply.unitCost,
      reason || `Movimiento de ${type === 'add' ? 'entrada' : 'salida'}`, req.user?.id
    ]);

    const response: ApiResponse = {
      success: true,
      message: `Stock ${type === 'add' ? 'agregado' : 'reducido'} exitosamente`,
      data: {
        previousStock: supply.stock,
        newStock,
        quantity,
        newStatus,
        movementId
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getLowStockItems = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const lowStockItems = await query<any>(`
      SELECT 
        s.*,
        s.unitCost as unitPrice,
        s.expiryDate as expirationDate,
        CASE 
          WHEN s.stock = 0 THEN 'out_of_stock'
          ELSE 'low_stock'
        END as stockStatus
      FROM supplies s
      WHERE s.stock <= s.minStock AND s.status != 'DISCONTINUED'
      ORDER BY s.stock ASC, s.name ASC
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Insumos con stock bajo obtenidos exitosamente',
      data: lowStockItems
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getInventoryStats = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const stats = await queryOne<any>(`
      SELECT 
        COUNT(*) as totalItems,
        SUM(s.stock * s.unitCost) as totalValue,
        COUNT(CASE WHEN s.stock <= s.minStock THEN 1 END) as lowStockItems,
        COUNT(CASE WHEN s.stock = 0 THEN 1 END) as outOfStockItems,
        AVG(s.unitCost) as avgUnitPrice
      FROM supplies s
      WHERE s.status != 'DISCONTINUED'
    `);

    const response: ApiResponse = {
      success: true,
      message: 'Estadísticas de inventario obtenidas exitosamente',
      data: stats || {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        avgUnitPrice: 0
      }
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const toggleSupplyStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const supply = await queryOne<any>(`
      SELECT * FROM supplies WHERE id = ?
    `, [id]);

    if (!supply) {
      throw new AppError('Insumo no encontrado', 404);
    }

    const newStatus = supply.status === 'DISCONTINUED' ? 'ACTIVE' : 'DISCONTINUED';
    
    await query(`
      UPDATE supplies SET status = ?, updatedAt = NOW()
      WHERE id = ?
    `, [newStatus, id]);

    const response: ApiResponse = {
      success: true,
      message: `Insumo ${newStatus === 'ACTIVE' ? 'activado' : 'desactivado'} exitosamente`
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const getSupplyMovements = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Verificar que el insumo existe
    const supply = await queryOne<any>(`
      SELECT * FROM supplies WHERE id = ?
    `, [id]);

    if (!supply) {
      throw new AppError('Insumo no encontrado', 404);
    }

    // Obtener total de movimientos
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total FROM supply_movements WHERE supplyId = ?
    `, [id]);

    const total = totalResult?.total || 0;

    // Obtener todos los movimientos sin LIMIT/OFFSET para compatibilidad Railway MySQL
    const allMovements = await query<any>(`
      SELECT 
        sm.id,
        sm.quantity,
        sm.reason,
        sm.createdBy,
        sm.createdAt,
        CASE 
          WHEN sm.type = 'IN' THEN 'add'
          WHEN sm.type = 'OUT' THEN 'subtract'
          WHEN sm.type = 'ADJUST' THEN 'adjust'
          WHEN sm.type = 'EXPIRED' THEN 'expired'
          ELSE 'add'
        END as type,
        CASE 
          WHEN sm.type = 'IN' THEN 'Entrada'
          WHEN sm.type = 'OUT' THEN 'Salida'
          WHEN sm.type = 'ADJUST' THEN 'Ajuste'
          WHEN sm.type = 'EXPIRED' THEN 'Vencido'
          ELSE 'Entrada'
        END as typeLabel,
        0 as previousStock,
        0 as newStock
      FROM supply_movements sm
      WHERE sm.supplyId = ?
      ORDER BY sm.createdAt DESC
    `, [id]);

    // Aplicar paginación manual
    const movements = allMovements.slice(offset, offset + limit);

    const response: PaginatedResponse = {
      success: true,
      data: movements,
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

export const getAllMovements = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const supplyId = req.query.supplyId as string;
    const type = req.query.type as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (supplyId) {
      whereClause += ` AND sm.supplyId = ?`;
      params.push(supplyId);
    }

    if (type && ['add', 'subtract', 'adjust', 'expired'].includes(type)) {
      let dbType;
      switch (type) {
        case 'add': dbType = 'IN'; break;
        case 'subtract': dbType = 'OUT'; break;
        case 'adjust': dbType = 'ADJUST'; break;
        case 'expired': dbType = 'EXPIRED'; break;
        default: dbType = 'IN';
      }
      whereClause += ` AND sm.type = ?`;
      params.push(dbType);
    }

    // Obtener total de movimientos
    const totalResult = await queryOne<{ total: number }>(`
      SELECT COUNT(*) as total FROM supply_movements sm ${whereClause}
    `, params);

    const total = totalResult?.total || 0;

    // Obtener todos los movimientos sin LIMIT/OFFSET para compatibilidad Railway MySQL
    const allMovements = await query<any>(`
      SELECT 
        sm.id,
        sm.supplyId,
        sm.quantity,
        sm.reason,
        sm.createdBy,
        sm.createdAt,
        s.name as supplyName,
        s.unit as supplyUnit,
        CASE 
          WHEN sm.type = 'IN' THEN 'add'
          WHEN sm.type = 'OUT' THEN 'subtract'
          WHEN sm.type = 'ADJUST' THEN 'adjust'
          WHEN sm.type = 'EXPIRED' THEN 'expired'
          ELSE 'add'
        END as type,
        CASE 
          WHEN sm.type = 'IN' THEN 'Entrada'
          WHEN sm.type = 'OUT' THEN 'Salida'
          WHEN sm.type = 'ADJUST' THEN 'Ajuste'
          WHEN sm.type = 'EXPIRED' THEN 'Vencido'
          ELSE 'Entrada'
        END as typeLabel,
        0 as previousStock,
        0 as newStock
      FROM supply_movements sm
      LEFT JOIN supplies s ON sm.supplyId = s.id
      ${whereClause}
      ORDER BY sm.createdAt DESC
    `, params);

    // Aplicar paginación manual
    const movements = allMovements.slice(offset, offset + limit);

    const response: PaginatedResponse = {
      success: true,
      data: movements,
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
