import { Router } from 'express';
import { register, login, getUsers, resetPasswordWithToken, requestPasswordReset, sendUserPasswordResetLink } from '../controllers/authController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { officerMiddleware } from '../middlewares/role.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/password-reset-link', requestPasswordReset);
router.post('/reset-password', resetPasswordWithToken);
router.get('/users', authMiddleware, officerMiddleware, getUsers);
router.post('/users/:id/password-reset-link', authMiddleware, officerMiddleware, sendUserPasswordResetLink);

export default router;
