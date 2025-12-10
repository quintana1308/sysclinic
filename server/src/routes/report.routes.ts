import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess } from '../middleware/permissions';
import { validateLicense } from '../middleware/licenseValidation';
import {
  getRevenueReport,
  getAppointmentsReport,
  getTreatmentsReport,
  getClientsReport,
  getDashboardReport
} from '../controllers/report.controller';

const router = Router();

// Middleware de autenticación y validación de licencia para todas las rutas
router.use(authenticate);
router.use(requireCompanyAccess);
router.use(validateLicense);

// Rutas de reportes
router.get('/revenue', getRevenueReport);
router.get('/appointments', getAppointmentsReport);
router.get('/treatments', getTreatmentsReport);
router.get('/clients', getClientsReport);
router.get('/dashboard', getDashboardReport);

export default router;
