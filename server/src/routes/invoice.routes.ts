import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceStats,
  markOverdueInvoices
} from '../controllers/invoice.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todas las facturas
router.get('/', 
  requirePermission({ resource: 'invoices', action: 'read' }),
  getInvoices
);

// Obtener estadísticas de facturas
router.get('/stats', 
  requirePermission({ resource: 'invoices', action: 'read' }),
  getInvoiceStats
);

// Marcar facturas vencidas
router.patch('/mark-overdue', 
  requirePermission({ resource: 'invoices', action: 'update' }),
  markOverdueInvoices
);

// Crear nueva factura
router.post('/', 
  requirePermission({ resource: 'invoices', action: 'create' }),
  createInvoice
);

// Obtener factura específica
router.get('/:id', 
  requirePermission({ resource: 'invoices', action: 'read' }),
  getInvoiceById
);

// Actualizar factura
router.put('/:id', 
  requirePermission({ resource: 'invoices', action: 'update' }),
  updateInvoice
);

// Eliminar factura
router.delete('/:id', 
  requirePermission({ resource: 'invoices', action: 'delete' }),
  deleteInvoice
);

export default router;
