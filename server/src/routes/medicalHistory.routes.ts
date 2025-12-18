import { Router } from 'express';
import { 
  getMedicalHistory, 
  getMedicalHistoryRecord, 
  updateMedicalHistory, 
  deleteAttachment,
  upload 
} from '../controllers/medicalHistory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener historial médico de un cliente específico
// Acceso: Master, Admin, Empleados de la empresa, Cliente propietario
router.get('/client/:clientId', getMedicalHistory);

// Obtener un registro específico del historial médico
// Acceso: Master, Admin, Empleados de la empresa, Cliente propietario
router.get('/:id', getMedicalHistoryRecord);

// Actualizar historial médico (con subida de archivos)
// Acceso: Master, Admin, Empleados de la empresa
router.put('/:id', upload.array('attachments', 5), updateMedicalHistory);

// Eliminar archivo específico del historial médico
// Acceso: Master, Admin, Empleados de la empresa
router.delete('/:id/attachment/:filename', deleteAttachment);

export default router;
