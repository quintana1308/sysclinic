import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess, requirePermission } from '../middleware/permissions';
import { validateLicense } from '../middleware/licenseValidation';
import {
  getTreatments,
  getTreatmentById,
  createTreatment,
  updateTreatment,
  deleteTreatment,
  toggleTreatmentStatus
} from '../controllers/treatment.controller';

const router = Router();

// Todas las rutas requieren autenticación, acceso a empresa y licencia válida
router.use(authenticate);
router.use(requireCompanyAccess);
router.use(validateLicense);

// Obtener todos los tratamientos
router.get('/', 
  requirePermission({ resource: 'treatments', action: 'read' }),
  getTreatments
);

// Crear nuevo tratamiento (solo admin y master)
router.post('/', 
  requirePermission({ resource: 'treatments', action: 'create' }),
  createTreatment
);

// Obtener tratamiento específico
router.get('/:id', 
  requirePermission({ resource: 'treatments', action: 'read' }),
  getTreatmentById
);

// Actualizar tratamiento (solo admin y master)
router.put('/:id', 
  requirePermission({ resource: 'treatments', action: 'update' }),
  updateTreatment
);

// Eliminar tratamiento (solo admin y master)
router.delete('/:id', 
  requirePermission({ resource: 'treatments', action: 'delete' }),
  deleteTreatment
);

// Activar/desactivar tratamiento (solo admin y master)
router.patch('/:id/toggle-status', 
  requirePermission({ resource: 'treatments', action: 'update' }),
  toggleTreatmentStatus
);

export default router;
