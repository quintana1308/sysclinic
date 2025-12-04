import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess } from '../middleware/permissions';
import {
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  updateCompanySettings,
  switchCompany,
  getUserCompanies
} from '../controllers/company.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener empresas disponibles para el usuario actual
router.get('/available', getUserCompanies);

// Cambiar empresa actual (solo master)
router.post('/switch', switchCompany);

// Obtener todas las empresas (solo master)
router.get('/', getCompanies);

// Crear nueva empresa (solo master)
router.post('/', createCompany);

// Obtener empresa específica
router.get('/:id', getCompany);

// Actualizar empresa
router.put('/:id', updateCompany);

// Actualizar configuración de empresa
router.put('/:id/settings', updateCompanySettings);

export default router;
