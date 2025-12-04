import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireCompanyAccess, requirePermission } from '../middleware/permissions';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeSchedule
} from '../controllers/employee.controller';

const router = Router();

// Todas las rutas requieren autenticación y acceso a empresa
router.use(authenticate);
router.use(requireCompanyAccess);

// Obtener todos los empleados
router.get('/', 
  requirePermission({ resource: 'employees', action: 'read' }),
  getEmployees
);

// Crear nuevo empleado (solo admin y master)
router.post('/', 
  requirePermission({ resource: 'employees', action: 'create' }),
  createEmployee
);

// Obtener empleado específico
router.get('/:id', 
  requirePermission({ resource: 'employees', action: 'read' }),
  getEmployeeById
);

// Actualizar empleado (solo admin y master)
router.put('/:id', 
  requirePermission({ resource: 'employees', action: 'update' }),
  updateEmployee
);

// Eliminar empleado (solo admin y master)
router.delete('/:id', 
  requirePermission({ resource: 'employees', action: 'delete' }),
  deleteEmployee
);

// Obtener horario del empleado
router.get('/:id/schedule', 
  requirePermission({ resource: 'employees', action: 'read' }),
  getEmployeeSchedule
);

export default router;
