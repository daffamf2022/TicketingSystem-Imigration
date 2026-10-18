import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { getJakartaDateString } from '../lib/date';

/**
 * Restrict reservation requests to same-day appointments only.
 */
export const dateMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quota_id, date } = req.body;

    let targetDate: Date | null = null;

    if (quota_id) {
      // Look up the slot in the database to fetch the true date
      const quota = await prisma.quota.findUnique({
        where: { id: quota_id },
      });

      if (!quota) {
        res.status(404).json({ status: 'error', message: 'Slot kuota tidak ditemukan.' });
        return;
      }
      targetDate = new Date(quota.date);
    } else if (date) {
      targetDate = new Date(date);
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
      res.status(400).json({ status: 'error', message: 'Tanggal reservasi atau quota_id wajib disertakan dengan format valid.' });
      return;
    }

    const todayStr = getJakartaDateString();
    const targetDateStr = targetDate.toISOString().slice(0, 10);

    if (targetDateStr !== todayStr) {
      res.status(400).json({
        status: 'error',
        message: 'Permohonan hanya dapat diajukan untuk jadwal hari ini.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default dateMiddleware;
