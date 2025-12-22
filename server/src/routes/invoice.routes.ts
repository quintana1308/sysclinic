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
  markOverdueInvoices,
  applyDiscountToInvoice,
  removeDiscountFromInvoice,
  checkInvoiceByAppointment
} from '../controllers/invoice.controller';
import { debugPayments } from '../controllers/payment.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Verificar si existe factura por appointmentId
router.get('/check-by-appointment/:appointmentId', 
  requirePermission({ resource: 'invoices', action: 'read' }),
  checkInvoiceByAppointment
);

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

// Debug: Verificar pagos de una factura
router.get('/:id/debug-payments', 
  requirePermission({ resource: 'invoices', action: 'read' }),
  debugPayments
);

// Actualizar factura
router.put('/:id', 
  requirePermission({ resource: 'invoices', action: 'update' }),
  updateInvoice
);

// Aplicar descuento a factura
router.patch('/:id/apply-discount', 
  requirePermission({ resource: 'invoices', action: 'update' }),
  applyDiscountToInvoice
);

// Remover descuento de factura
router.patch('/:id/remove-discount', 
  requirePermission({ resource: 'invoices', action: 'update' }),
  removeDiscountFromInvoice
);

// Eliminar factura
router.delete('/:id', 
  requirePermission({ resource: 'invoices', action: 'delete' }),
  deleteInvoice
);

export default router;
