import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess, requirePermission } from '../middleware/permissions';
import {
  getSupplies,
  getSupplyById,
  createSupply,
  updateSupply,
  deleteSupply,
  updateStock,
  getLowStockItems,
  getInventoryStats,
  toggleSupplyStatus,
  getSupplyMovements,
  getAllMovements
} from '../controllers/supply.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los insumos
router.get('/', 
  requirePermission({ resource: 'inventory', action: 'read' }),
  getSupplies
);

// Obtener estadísticas de inventario
router.get('/stats', 
  requirePermission({ resource: 'inventory', action: 'read' }),
  getInventoryStats
);

// Obtener insumos con stock bajo
router.get('/low-stock', 
  requirePermission({ resource: 'inventory', action: 'read' }),
  getLowStockItems
);

// Obtener todos los movimientos de inventario
router.get('/movements', 
  requirePermission({ resource: 'inventory', action: 'read' }),
  getAllMovements
);

// Crear nuevo insumo (solo admin y master)
router.post('/', 
  requirePermission({ resource: 'inventory', action: 'create' }),
  createSupply
);

// Obtener insumo específico
router.get('/:id', 
  requirePermission({ resource: 'inventory', action: 'read' }),
  getSupplyById
);

// Obtener movimientos de un insumo específico
router.get('/:id/movements', 
  requirePermission({ resource: 'inventory', action: 'read' }),
  getSupplyMovements
);

// Actualizar insumo (solo admin y master)
router.put('/:id', 
  requirePermission({ resource: 'inventory', action: 'update' }),
  updateSupply
);

// Actualizar stock de insumo
router.patch('/:id/stock', 
  requirePermission({ resource: 'inventory', action: 'update' }),
  updateStock
);

// Activar/desactivar insumo (solo admin y master)
router.patch('/:id/toggle-status', 
  requirePermission({ resource: 'inventory', action: 'update' }),
  toggleSupplyStatus
);

// Eliminar insumo (solo admin y master)
router.delete('/:id', 
  requirePermission({ resource: 'inventory', action: 'delete' }),
  deleteSupply
);

export default router;
