import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';

/**
 * Controller to handle reservation bookings securely inside database transactions.
 */
export const createReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const files = req.files as Express.Multer.File[] | undefined;

    // Support both snake_case (requested) and camelCase payloads
    const quotaIdInput = req.body.quota_id || req.body.quotaId;
    const needsCompanionInput = req.body.needs_companion || req.body.needsDisabilityFacility;
    const {
      disabilityType,
      companionName,
      companionNik,
    } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Silakan masuk sebagai pemohon sebelum membuat permohonan.' });
      return;
    }

    if (!quotaIdInput) {
      res.status(400).json({ status: 'error', message: 'Quota ID wajib disertakan.' });
      return;
    }

    const isDisabled = needsCompanionInput === 'true' || needsCompanionInput === true;
    const priorityCategory = String(disabilityType || '').split(' | ')[0].trim().toLowerCase();
    const allowedPriorityCategories = new Set(['lansia', 'disabilitas', 'hamil', 'balita']);
    if (!isDisabled || !allowedPriorityCategories.has(priorityCategory)) {
      res.status(400).json({
        status: 'error',
        message: 'Sistem ini hanya menerima permohonan dari kategori layanan prioritas.',
      });
      return;
    }

    const submittedDocumentTypes = req.body.document_types;
    const documentTypes: string[] = Array.isArray(submittedDocumentTypes)
      ? submittedDocumentTypes
      : submittedDocumentTypes
        ? [submittedDocumentTypes]
        : [];
    const allowedDocumentTypes = new Set(['KTP', 'KK', 'DOKUMEN_PENDUKUNG']);
    const uploadedDocumentTypes = (files || []).map((file, index) => {
      const submittedType = documentTypes[index];
      if (submittedType && allowedDocumentTypes.has(submittedType)) {
        return submittedType;
      }

      const originalNameLower = file.originalname.toLowerCase();
      if (originalNameLower.includes('ktp')) return 'KTP';
      if (originalNameLower.includes('kk') || originalNameLower.includes('kartu keluarga')) return 'KK';
      return 'DOKUMEN_PENDUKUNG';
    });
    const cleanCompanionName = isDisabled ? String(companionName || '').trim() || null : null;
    const cleanCompanionNik = isDisabled ? String(companionNik || '').trim() || null : null;

    // Run the reservation inside a database transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch and lock the quota
      const quota = await tx.quota.findUnique({
        where: { id: quotaIdInput },
      });

      if (!quota) {
        throw new Error('QUOTA_NOT_FOUND');
      }

      // Serialize bookings for this applicant so concurrent requests cannot use different slots to bypass the daily limit.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0)) IS NOT NULL AS locked`;

      const activeReservation = await tx.reservation.findFirst({
        where: {
          userId,
          status: { in: ['PENDING', 'VERIFIED'] },
          quota: { date: quota.date },
        },
        select: { id: true },
      });
      if (activeReservation) {
        throw new Error('ACTIVE_RESERVATION_EXISTS');
      }

      const cutoffMinutes = quota.cutoffMinutes ?? 0;
      if (cutoffMinutes > 0) {
        const [startHour, startMinute] = quota.startTime.split(':').map(Number);
        const slotStart = new Date(quota.date);
        slotStart.setHours(startHour, startMinute, 0, 0);

        const cutoffTime = new Date(slotStart);
        cutoffTime.setMinutes(cutoffTime.getMinutes() - cutoffMinutes);

        if (new Date() > cutoffTime) {
          throw new Error('CUT_OFF_REACHED');
        }
      }

      // 2. Check availability
      if (quota.remainingQuota <= 0) {
        throw new Error('QUOTA_EXHAUSTED');
      }

      // 3. Atomic decrement
      const updateResult = await tx.quota.updateMany({
        where: {
          id: quotaIdInput,
          remainingQuota: { gt: 0, lte: 5 },
        },
        data: {
          remainingQuota: { decrement: 1 },
        },
      });

      if (updateResult.count === 0) {
        throw new Error('QUOTA_EXHAUSTED');
      }

      // 4. Generate a unique application code for pending registration.
      const createUniqueApplicationCode = async () => {
        let code = `APP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        let exists = await tx.reservation.findUnique({
          where: { applicationCode: code },
        });

        while (exists) {
          code = `APP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          exists = await tx.reservation.findUnique({
            where: { applicationCode: code },
          });
        }

        return code;
      };

      const applicationCode = await createUniqueApplicationCode();

      // 5. Create the reservation with the unique application code.
      const reservation = await tx.reservation.create({
        data: {
          userId,
          quotaId: quotaIdInput,
          applicationCode,
          queueNumber: null,
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
            companionName: cleanCompanionName,
            companionNik: cleanCompanionNik,
          },
        });
      }

      // 7. Store document metadata if documents are uploaded
      const documents = [];
      if (files && files.length > 0) {
        for (const [index, file] of files.entries()) {
          const doc = await tx.document.create({
            data: {
              reservationId: reservation.id,
              documentType: uploadedDocumentTypes[index],
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
        application_code: result.reservation.applicationCode,
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
      if (error.message === 'ACTIVE_RESERVATION_EXISTS') {
        res.status(409).json({
          status: 'error',
          message: 'Anda sudah memiliki permohonan aktif pada tanggal pelayanan ini. Satu pemohon hanya dapat memiliki satu permohonan aktif per hari.',
        });
        return;
      }
      if (error.message === 'QUOTA_EXHAUSTED') {
        res.status(400).json({ status: 'error', message: 'Kuota untuk slot ini sudah habis.' });
        return;
      }
      if (error.message === 'CUT_OFF_REACHED') {
        res.status(400).json({ status: 'error', message: 'Cut-off pemesanan untuk slot ini sudah tercapai. Silakan pilih slot lain.' });
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
      res.status(401).json({ status: 'error', message: 'Silakan masuk untuk melihat detail tiket.' });
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

    // Only the authenticated owner can load the ticket details.
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

    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ status: 'error', message: 'Status tidak valid.' });
      return;
    }

    const existing = await prisma.reservation.findUnique({
      where: { id },
      include: {
        quota: true,
        companion: true,
      },
    });

    if (!existing) {
      res.status(404).json({ status: 'error', message: 'Tiket tidak ditemukan.' });
      return;
    }

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['VERIFIED', 'REJECTED', 'CANCELLED'],
      VERIFIED: ['COMPLETED', 'CANCELLED'],
    };
    if (!allowedTransitions[existing.status]?.includes(status)) {
      res.status(400).json({
        status: 'error',
        message: 'Perubahan status tidak diizinkan dari status saat ini.',
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      let finalQueueNumber = existing.queueNumber;

      if (status === 'VERIFIED' && !existing.queueNumber) {
        const assignedCount = await tx.reservation.count({
          where: {
            quotaId: existing.quotaId,
            queueNumber: { startsWith: 'D-' },
          },
        });
        finalQueueNumber = `D-${String(assignedCount + 1).padStart(2, '0')}`;
      }

      const transition = await tx.reservation.updateMany({
        where: { id, status: existing.status },
        data: { status, queueNumber: finalQueueNumber },
      });
      if (transition.count !== 1) {
        throw new Error('RESERVATION_STATUS_CONFLICT');
      }

      const updatedReservation = await tx.reservation.findUnique({
        where: { id },
        include: {
          quota: true,
          companion: true,
          documents: true,
          user: { select: { name: true, nik: true } },
        },
      });
      if (!updatedReservation) {
        throw new Error('RESERVATION_NOT_FOUND');
      }

      if (status === 'REJECTED' || status === 'CANCELLED') {
        await tx.quota.update({
          where: { id: existing.quotaId },
          data: { remainingQuota: { increment: 1 } },
        });
        await tx.quota.updateMany({
          where: { id: existing.quotaId, remainingQuota: { gt: Math.min(existing.quota.maxQuota, 5) } },
          data: { remainingQuota: Math.min(existing.quota.maxQuota, 5) },
        });
      }

      return updatedReservation;
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'RESERVATION_STATUS_CONFLICT') {
      res.status(409).json({ status: 'error', message: 'Status permohonan baru saja berubah. Muat ulang data sebelum mencoba kembali.' });
      return;
    }
    next(error);
  }
};

export const deleteReservation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!reservation) {
      res.status(404).json({ status: 'error', message: 'Tiket reservasi tidak ditemukan.' });
      return;
    }

    if (reservation.status !== 'COMPLETED') {
      res.status(400).json({ status: 'error', message: 'Hanya tiket dengan status COMPLETED yang dapat dihapus.' });
      return;
    }

    await prisma.reservation.delete({
      where: { id },
    });

    res.status(200).json({
      status: 'success',
      message: 'Tiket antrean berhasil dihapus.',
    });
  } catch (error) {
    next(error);
  }
};
