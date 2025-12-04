import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess, requirePermission } from '../middleware/permissions';
import {
  getPayments,
  getPaymentById,
  createPayment,
  getPaymentStats,
  debugPayments
} from '../controllers/payment.controller';

const router = Router();

// Todas las rutas requieren autenticación y acceso a empresa
router.use(authenticate);
router.use(requireCompanyAccess);

// Obtener todas los pagos
router.get('/', 
  requirePermission({ resource: 'payments', action: 'read' }),
  getPayments
);

// Crear nuevo pago
router.post('/', 
  requirePermission({ resource: 'payments', action: 'create' }),
  createPayment
);

// Obtener estadísticas de pagos
router.get('/stats', 
  requirePermission({ resource: 'payments', action: 'read' }),
  getPaymentStats
);

// Debug: Verificar pagos de una factura específica
router.get('/debug/:invoiceId', 
  requirePermission({ resource: 'payments', action: 'read' }),
  debugPayments
);

// Obtener pago específico
router.get('/:id', 
  requirePermission({ resource: 'payments', action: 'read' }),
  getPaymentById
);

export default router;
