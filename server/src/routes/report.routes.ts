import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess } from '../middleware/permissions';
import {
  getRevenueReport,
  getAppointmentsReport,
  getTreatmentsReport,
  getClientsReport,
  getDashboardReport
} from '../controllers/report.controller';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

// Rutas de reportes
router.get('/revenue', requireCompanyAccess, getRevenueReport);
router.get('/appointments', requireCompanyAccess, getAppointmentsReport);
router.get('/treatments', requireCompanyAccess, getTreatmentsReport);
router.get('/clients', requireCompanyAccess, getClientsReport);
router.get('/dashboard', requireCompanyAccess, getDashboardReport);

export default router;
