import { Router } from 'express';
import { getAvailableQuotas, getQuotaOverview, updateQuotaSlot } from '../controllers/quotaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { officerMiddleware } from '../middlewares/role.middleware';

const router = Router();

// Public route to view available quotas
router.get('/', getAvailableQuotas);

// Protected route for officer dashboard monitoring and manual quota updates
router.get('/admin', authMiddleware, officerMiddleware, getQuotaOverview);
router.patch('/:id', authMiddleware, officerMiddleware, updateQuotaSlot);

export default router;
