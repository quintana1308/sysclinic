import express from 'express';
import {
  getLicenses,
  getLicenseById,
  createLicense,
  updateLicense,
  deleteLicense,
  getLicenseStats,
  toggleLicense,
  renewLicense
} from '../controllers/license.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todas las licencias (solo master)
router.get('/', authorize('master'), getLicenses);

// Obtener estadísticas de licencias (solo master)
router.get('/stats', authorize('master'), getLicenseStats);

// Obtener licencia por ID (solo master)
router.get('/:id', authorize('master'), getLicenseById);

// Crear nueva licencia (solo master)
router.post('/', authorize('master'), createLicense);

// Actualizar licencia (solo master)
router.put('/:id', authorize('master'), updateLicense);

// Activar/Desactivar licencia (solo master)
router.patch('/:id/toggle', authorize('master'), toggleLicense);

// Renovar licencia (solo master)
router.patch('/:id/renew', authorize('master'), renewLicense);

// Eliminar licencia (solo master)
router.delete('/:id', authorize('master'), deleteLicense);

export default router;
