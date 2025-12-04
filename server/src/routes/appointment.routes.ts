import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess, requirePermission } from '../middleware/permissions';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus
} from '../controllers/appointment.controller';

const router = Router();

// Todas las rutas requieren autenticación y acceso a empresa
router.use(authenticate);
router.use(requireCompanyAccess);

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

// Eliminar cita
router.delete('/:id', 
  requirePermission({ resource: 'appointments', action: 'delete' }),
  deleteAppointment
);

export default router;
