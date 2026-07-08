import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Controller to handle reservation bookings securely inside database transactions.
 */
export const createReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Pengguna tidak terotentikasi.' });
      return;
    }

    // Support both snake_case (requested) and camelCase payloads
    const quotaIdInput = req.body.quota_id || req.body.quotaId;
    const needsCompanionInput = req.body.needs_companion || req.body.needsDisabilityFacility;
    const {
      disabilityType,
      companionName,
      companionNik,
    } = req.body;

    if (!quotaIdInput) {
      res.status(400).json({ status: 'error', message: 'Quota ID wajib disertakan.' });
      return;
    }

    const isDisabled = needsCompanionInput === 'true' || needsCompanionInput === true;
    const files = req.files as Express.Multer.File[] | undefined;

    // Run the reservation inside a database transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and lock the quota
      const quota = await tx.quota.findUnique({
        where: { id: quotaIdInput },
      });

      if (!quota) {
        throw new Error('QUOTA_NOT_FOUND');
      }

      // 2. Check availability
      if (quota.remainingQuota <= 0) {
        throw new Error('QUOTA_EXHAUSTED');
      }

      // 3. Atomic decrement
      const updateResult = await tx.quota.updateMany({
        where: {
          id: quotaIdInput,
          remainingQuota: { gt: 0 },
        },
        data: {
          remainingQuota: { decrement: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new Error('QUOTA_EXHAUSTED');
      }

      // 4. Generate queue number (starts from 1 per category, per date)
      const prefix = isDisabled ? 'D' : 'P';
      const count = await tx.reservation.count({
        where: {
          quota: {
            date: quota.date,
          },
          queueNumber: {
            startsWith: `${prefix}-`,
          },
        },
      });

      const nextSeq = count + 1;
      const queueNumber = `${prefix}-${String(nextSeq).padStart(2, '0')}`;

      // 5. Create the reservation
      const reservation = await tx.reservation.create({
        data: {
          userId,
          quotaId: quotaIdInput,
          queueNumber,
          status: 'PENDING',
        },
      });

      // 6. Store companion details if priority/disability is enabled or if metadata is provided
      let companion = null;
      if (isDisabled || disabilityType) {
        companion = await tx.companion.create({
          data: {
            reservationId: reservation.id,
            needsDisabilityFacility: isDisabled,
            disabilityType: disabilityType || 'Umum',
            companionName: companionName || null,
            companionNik: companionNik || null,
          },
        });
      }

      // 7. Store document metadata if documents are uploaded
      const documents = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const originalNameLower = file.originalname.toLowerCase();
          let docType = 'DOKUMEN_PENDUKUNG';
          if (originalNameLower.includes('ktp')) {
            docType = 'KTP';
          } else if (originalNameLower.includes('kk') || originalNameLower.includes('kartu keluarga')) {
            docType = 'KK';
          }

          const doc = await tx.document.create({
            data: {
              reservationId: reservation.id,
              documentType: docType,
              filePath: file.filename,
            },
          });
          documents.push(doc);
        }
      }

      return { reservation, companion, documents };
    });

    res.status(201).json({
      status: 'success',
      message: 'Reservasi antrean berhasil dibuat.',
      data: {
        reservation_id: result.reservation.id,
        queue_number: result.reservation.queueNumber,
        status: result.reservation.status,
        companion: result.companion ? {
          companion_name: result.companion.companionName,
          companion_nik: result.companion.companionNik,
          disability_type: result.companion.disabilityType,
        } : null,
        documents: result.documents.map((d) => ({
          id: d.id,
          document_type: d.documentType,
          file_name: d.filePath,
        })),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'QUOTA_NOT_FOUND') {
        res.status(404).json({ status: 'error', message: 'Slot kuota tidak ditemukan.' });
        return;
      }
      if (error.message === 'QUOTA_EXHAUSTED') {
        res.status(400).json({ status: 'error', message: 'Kuota untuk slot ini sudah habis.' });
        return;
      }
    }
    next(error);
  }
};

export const getReservationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Pengguna tidak terotentikasi.' });
      return;
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        quota: true,
        companion: true,
        documents: true,
        user: {
          select: {
            name: true,
            nik: true,
          },
        },
      },
    });

    if (!reservation) {
      res.status(404).json({ status: 'error', message: 'Tiket reservasi tidak ditemukan.' });
      return;
    }

    // Secure checking: only allow the owner of the ticket to load details
    if (reservation.userId !== userId) {
      res.status(403).json({ status: 'error', message: 'Akses ditolak. Tiket ini milik pengguna lain.' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
};

export const getReservations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Pengguna tidak terotentikasi.' });
      return;
    }

    const whereCondition = role === 'OFFICER' ? {} : { userId };

    const reservations = await prisma.reservation.findMany({
      where: whereCondition,
      include: {
        quota: true,
        companion: true,
        documents: true,
        user: {
          select: {
            name: true,
            nik: true,
          },
        },
      },
      orderBy: [
        { quota: { date: 'desc' } },
        { quota: { startTime: 'asc' } },
      ],
    });

    res.status(200).json({
      status: 'success',
      data: reservations,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReservationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'VERIFIED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ status: 'error', message: 'Status tidak valid.' });
      return;
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        quota: true,
        companion: true,
        documents: true,
        user: {
          select: {
            name: true,
            nik: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
