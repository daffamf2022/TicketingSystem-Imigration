import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import {
  getJakartaDateString,
  getJakartaSlotCutoff,
  toDatabaseDate,
} from '../lib/date';

/**
 * Return same-day appointment slots that are currently available.
 */
const parseCutoffTimeToMinutes = (cutoffTime: string, slotStartTime: string): number | null => {
  if (!cutoffTime || typeof cutoffTime !== 'string') {
    return null;
  }

  const match = /^\d{2}:\d{2}$/.test(cutoffTime.trim());
  if (!match) {
    return null;
  }

  const [cutoffHour, cutoffMinute] = cutoffTime.trim().split(':').map(Number);
  const [slotHour, slotMinute] = slotStartTime.split(':').map(Number);
  const slotStartTotal = slotHour * 60 + slotMinute;
  const cutoffTotal = cutoffHour * 60 + cutoffMinute;

  if (cutoffTotal >= slotStartTotal) {
    return 0;
  }

  return slotStartTotal - cutoffTotal;
};

const getSlotCutoffDate = (quotaDate: Date, startTime: string, cutoffMinutes: number | null | undefined) => {
  if (!cutoffMinutes || cutoffMinutes <= 0) {
    return null;
  }

  return getJakartaSlotCutoff(quotaDate, startTime, cutoffMinutes);
};

export const getAvailableQuotas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = getJakartaDateString();
    const targetDates = [toDatabaseDate(today)];
    const slots = [
      { startTime: '08:00', endTime: '10:00' },
      { startTime: '10:00', endTime: '12:00' },
      { startTime: '13:00', endTime: '15:00' },
    ];
    const perSlotQuotaLimit = 5;

    const normalizeStaleQuotaValues = async () => {
      const existingQuotas = await prisma.quota.findMany({
        where: {
          date: {
            in: targetDates,
          },
        },
      });

      for (const quota of existingQuotas) {
        const normalizedMaxQuota = Math.min(Math.max(quota.maxQuota, 0), perSlotQuotaLimit);
        const normalizedRemainingQuota = Math.min(
          Math.max(quota.remainingQuota, 0),
          normalizedMaxQuota,
        );

        const needsNormalization =
          quota.maxQuota !== normalizedMaxQuota ||
          quota.remainingQuota !== normalizedRemainingQuota;

        if (needsNormalization) {
          await prisma.quota.update({
            where: { id: quota.id },
            data: {
              maxQuota: normalizedMaxQuota,
              remainingQuota: normalizedRemainingQuota,
            },
          });
        }
      }
    };

    const ensureDefaultQuotas = async () => {
      const existingQuotas = await prisma.quota.findMany({
        where: {
          date: {
            in: targetDates,
          },
        },
        select: {
          date: true,
          startTime: true,
          endTime: true,
        },
      });

      const existingKeys = new Set(
        existingQuotas.map((quota) => `${quota.date.toISOString()}|${quota.startTime}|${quota.endTime}`)
      );

      const missingQuotas = [] as Array<{
        date: Date;
        startTime: string;
        endTime: string;
        maxQuota: number;
        remainingQuota: number;
      }>;

      for (const date of targetDates) {
        for (const slot of slots) {
          const key = `${date.toISOString()}|${slot.startTime}|${slot.endTime}`;
          if (!existingKeys.has(key)) {
            missingQuotas.push({
              date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              maxQuota: perSlotQuotaLimit,
              remainingQuota: perSlotQuotaLimit,
            });
          }
        }
      }

      if (missingQuotas.length > 0) {
        await prisma.quota.createMany({
          data: missingQuotas,
          skipDuplicates: true,
        });
      }
    };

    await normalizeStaleQuotaValues();
    await ensureDefaultQuotas();

    const quotas = await prisma.quota.findMany({
      where: {
        date: {
          in: targetDates,
        },
        remainingQuota: {
          gt: 0,
        },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        maxQuota: true,
        remainingQuota: true,
        cutoffMinutes: true,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    const now = new Date();
    const formattedQuotas = quotas
      .filter((q) => {
        const cutoff = getSlotCutoffDate(new Date(q.date), q.startTime, q.cutoffMinutes);
        if (!cutoff) {
          return true;
        }
        return now <= cutoff;
      })
      .map((q) => ({
        id: q.id,
        date: q.date.toISOString().split('T')[0],
        start_time: q.startTime,
        end_time: q.endTime,
        max_quota: q.maxQuota,
        remaining_quota: q.remainingQuota,
        cutoff_minutes: q.cutoffMinutes ?? 0,
      }));

    res.status(200).json({
      status: 'success',
      data: formattedQuotas,
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotaOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = toDatabaseDate(getJakartaDateString());

    const quotas = await prisma.quota.findMany({
      where: {
        date: today,
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    const normalizedQuotas = await Promise.all(quotas.map(async (quota) => {
      const maxQuota = Math.min(Math.max(quota.maxQuota, 0), 5);
      const remainingQuota = Math.min(Math.max(quota.remainingQuota, 0), maxQuota);
      if (quota.maxQuota === maxQuota && quota.remainingQuota === remainingQuota) {
        return quota;
      }

      return prisma.quota.update({
        where: { id: quota.id },
        data: { maxQuota, remainingQuota },
      });
    }));

    res.status(200).json({
      status: 'success',
      data: normalizedQuotas.map((quota) => ({
        id: quota.id,
        date: quota.date.toISOString().split('T')[0],
        start_time: quota.startTime,
        end_time: quota.endTime,
        max_quota: quota.maxQuota,
        remaining_quota: quota.remainingQuota,
        cutoff_minutes: quota.cutoffMinutes ?? 0,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const updateQuotaSlot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const { adjustment, remainingQuota, cutoffMinutes, cutoffTime } = req.body;

    if (!id) {
      res.status(400).json({ status: 'error', message: 'ID slot kuota tidak valid.' });
      return;
    }

    const quota = await prisma.quota.findUnique({
      where: { id },
    });

    if (!quota) {
      res.status(404).json({ status: 'error', message: 'Slot kuota tidak ditemukan.' });
      return;
    }

    let nextRemainingQuota = quota.remainingQuota;
    let nextCutoffMinutes = quota.cutoffMinutes;

    const maximumQuota = Math.min(quota.maxQuota, 5);
    if (Number.isInteger(remainingQuota)) {
      nextRemainingQuota = Math.min(Math.max(remainingQuota, 0), maximumQuota);
    } else if (Number.isInteger(adjustment)) {
      nextRemainingQuota = Math.min(Math.max(quota.remainingQuota + adjustment, 0), maximumQuota);
    } else if (adjustment === undefined && remainingQuota === undefined && (cutoffMinutes !== undefined || cutoffTime !== undefined)) {
      // allowed: only updating policy cutoff
    } else {
      res.status(400).json({ status: 'error', message: 'Nilai perubahan kuota tidak valid.' });
      return;
    }

    if (cutoffTime !== undefined && cutoffTime !== null && cutoffTime !== '') {
      const parsedCutoff = parseCutoffTimeToMinutes(String(cutoffTime), quota.startTime);
      if (parsedCutoff === null) {
        res.status(400).json({ status: 'error', message: 'Waktu penutupan harus berformat HH:MM dan sebelum waktu slot dimulai.' });
        return;
      }
      nextCutoffMinutes = parsedCutoff;
    } else if (cutoffMinutes !== undefined && cutoffMinutes !== null && cutoffMinutes !== '') {
      const parsedCutoff = Number(cutoffMinutes);
      if (!Number.isInteger(parsedCutoff) || parsedCutoff < 0) {
        res.status(400).json({ status: 'error', message: 'Nilai waktu penutupan harus berupa menit yang valid.' });
        return;
      }
      nextCutoffMinutes = parsedCutoff;
    } else if (cutoffMinutes === 0 || cutoffTime === '00:00' || cutoffTime === '') {
      nextCutoffMinutes = 0;
    }

    const updatedQuota = await prisma.quota.update({
      where: { id },
      data: {
        remainingQuota: nextRemainingQuota,
        cutoffMinutes: nextCutoffMinutes,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Kuota berhasil diperbarui.',
      data: {
        id: updatedQuota.id,
        date: updatedQuota.date.toISOString().split('T')[0],
        start_time: updatedQuota.startTime,
        end_time: updatedQuota.endTime,
        max_quota: updatedQuota.maxQuota,
        remaining_quota: updatedQuota.remainingQuota,
        cutoff_minutes: updatedQuota.cutoffMinutes ?? 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
