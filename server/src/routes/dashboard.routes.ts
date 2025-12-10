import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess } from '../middleware/permissions';
import { validateLicense } from '../middleware/licenseValidation';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// Aplicar middleware de autenticación, empresa y validación de licencia a todas las rutas
router.use(authenticate);
router.use(requireCompanyAccess);
router.use(validateLicense);

// Rutas del dashboard
router.get('/', dashboardController.getDashboardData);
router.get('/stats', dashboardController.getDashboardStats);
router.get('/appointments/recent', dashboardController.getRecentAppointments);
router.get('/appointments/today', dashboardController.getTodayAppointments);
router.get('/revenue/stats', dashboardController.getRevenueStats);
router.get('/clients/stats', dashboardController.getClientStats);
router.get('/employees/stats', dashboardController.getEmployeeStats);

export default router;
