import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { requireCompanyAccess, requirePermission } from '../middleware/permissions';
import { validateLicense } from '../middleware/licenseValidation';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  toggleClientStatus,
  checkDatabaseData,
  getCurrentClient,
  updateCurrentClient
} from '../controllers/client.controller';

const router = Router();

// Endpoint temporal para verificar datos (sin restricciones)
router.get('/check-data', authenticate, checkDatabaseData);

// Endpoint para que clientes obtengan su propia información (solo autenticación)
router.get('/me', authenticate, getCurrentClient);

// Endpoint para que clientes actualicen su propia información (solo autenticación)
router.put('/me', authenticate, updateCurrentClient);

// Todas las rutas requieren autenticación, acceso a empresa y licencia válida
router.use(authenticate);
router.use(requireCompanyAccess);
router.use(validateLicense);

// Obtener todos los clientes
router.get('/', 
  requirePermission({ resource: 'clients', action: 'read' }),
  getClients
);

// Crear nuevo cliente
router.post('/', 
  requirePermission({ resource: 'clients', action: 'create' }),
  createClient
);

// Obtener cliente específico
router.get('/:id', 
  requirePermission({ resource: 'clients', action: 'read' }),
  getClientById
);

// Actualizar cliente
router.put('/:id', 
  requirePermission({ resource: 'clients', action: 'update' }),
  updateClient
);

// Activar/desactivar cliente
router.patch('/:id/toggle-status', 
  requirePermission({ resource: 'clients', action: 'update' }),
  toggleClientStatus
);

// Eliminar cliente (solo admin y master)
router.delete('/:id', 
  requirePermission({ resource: 'clients', action: 'delete' }),
  deleteClient
);

export default router;
