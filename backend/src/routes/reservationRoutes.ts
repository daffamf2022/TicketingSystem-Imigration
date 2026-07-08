import { Router } from 'express';
import { createReservation, getReservationById, getReservations, updateReservationStatus } from '../controllers/reservationController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { officerMiddleware } from '../middlewares/role.middleware';
import { upload } from '../middlewares/upload.middleware';
import { dateMiddleware } from '../middlewares/date.middleware';

const router = Router();

// Secure route: retrieve ticket details (filtered by role inside the controller)
router.get('/', authMiddleware, getReservations);

// Secure route: requires login, runs file upload parser, verifies reservation date boundaries, then runs transaction booking
router.post('/', authMiddleware, upload.array('documents', 5), dateMiddleware, createReservation);

// Secure route: retrieve ticket details by ID
router.get('/:id', authMiddleware, getReservationById);

// Secure route: update ticket status (Officer Only)
router.patch('/:id/status', authMiddleware, officerMiddleware, updateReservationStatus);

export default router;
