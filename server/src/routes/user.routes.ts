import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getUsers, getUserById, createUser, updateUser, deleteUser, getUserStats, getRoles } from '../controllers/user.controller';

const router = Router();

// Rutas de usuarios (solo para usuarios master)
router.get('/', authenticate, authorize('master'), getUsers);
router.get('/stats', authenticate, authorize('master'), getUserStats);
router.get('/roles', authenticate, getRoles);
router.get('/:id', authenticate, authorize('master'), getUserById);
router.post('/', authenticate, authorize('master'), createUser);
router.put('/:id', authenticate, authorize('master'), updateUser);
router.delete('/:id', authenticate, authorize('master'), deleteUser);

export default router;
