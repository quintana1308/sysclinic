import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess, requirePermission } from '../middleware/permissions';
import { validateLicense } from '../middleware/licenseValidation';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
  confirmAppointment,
  cancelAppointment
} from '../controllers/appointment.controller';

const router = Router();

// Todas las rutas requieren autenticación, acceso a empresa y licencia válida
router.use(authenticate);
router.use(requireCompanyAccess);
router.use(validateLicense);

// Obtener todas las citas
router.get('/', 
  requirePermission({ resource: 'appointments', action: 'read' }),
  getAppointments
);

// Crear nueva cita
router.post('/', 
  requirePermission({ resource: 'appointments', action: 'create' }),
  createAppointment
);

// Obtener cita específica
router.get('/:id', 
  requirePermission({ resource: 'appointments', action: 'read' }),
  getAppointmentById
);

// Actualizar cita
router.put('/:id', 
  requirePermission({ resource: 'appointments', action: 'update' }),
  updateAppointment
);

// Actualizar estado de cita
router.patch('/:id/status', 
  requirePermission({ resource: 'appointments', action: 'update' }),
  updateAppointmentStatus
);

// Confirmar cita
router.patch('/:id/confirm', 
  requirePermission({ resource: 'appointments', action: 'update' }),
  confirmAppointment
);

// Cancelar cita
router.patch('/:id/cancel', 
  requirePermission({ resource: 'appointments', action: 'update' }),
  cancelAppointment
);

// Eliminar cita
router.delete('/:id', 
  requirePermission({ resource: 'appointments', action: 'delete' }),
  deleteAppointment
);

export default router;
