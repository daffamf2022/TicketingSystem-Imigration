import { Router } from 'express';
import { createReservation, deleteReservation, getReservationById, getReservations, updateReservationStatus } from '../controllers/reservationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { customerMiddleware, officerMiddleware } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';
import { dateMiddleware } from '../middlewares/date.middleware';

const router = Router();

router.get('/', authMiddleware, getReservations);

router.post('/', authMiddleware, customerMiddleware, upload.array('documents', 5), dateMiddleware, createReservation);

router.get('/:id', authMiddleware, getReservationById);

// Secure route: update ticket status (Officer Only)
router.patch('/:id/status', authMiddleware, officerMiddleware, updateReservationStatus);

// Secure route: delete a completed ticket (Officer Only)
router.delete('/:id', authMiddleware, officerMiddleware, deleteReservation);

export default router;
