import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// TODO: Implementar controladores de usuarios
// router.get('/', authenticate, authorize('admin'), userController.getAll);
// router.get('/:id', authenticate, userController.getById);
// router.put('/:id', authenticate, userController.update);
// router.delete('/:id', authenticate, authorize('admin'), userController.delete);

export default router;
