import { Router } from 'express';
import { getAvailableQuotas } from '../controllers/quotaController';

const router = Router();

// Public route to view available quotas
router.get('/', getAvailableQuotas);

export default router;
