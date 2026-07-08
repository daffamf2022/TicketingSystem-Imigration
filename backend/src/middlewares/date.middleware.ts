import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

/**
 * Middleware to restrict reservation requests to Today (Hari H) and Tomorrow (Besok) only.
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

    const getLocalDateStr = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getUtcDateStr = (d: Date) => {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = getLocalDateStr(new Date());
    const tomorrowStr = getLocalDateStr(new Date(new Date().getTime() + 24 * 60 * 60 * 1000));

    const dateObj = targetDate instanceof Date ? targetDate : new Date(targetDate);
    const targetDateStr = getUtcDateStr(dateObj);

    console.log('DATE DIAGNOSTIC:', { 
      todayStr, 
      tomorrowStr, 
      targetDateStr, 
      targetDate, 
      dateObj,
      rawBody: req.body
    });

    if (targetDateStr !== todayStr && targetDateStr !== tomorrowStr) {
      res.status(400).json({
        status: 'error',
        message: 'Jadwal reservasi hanya diperbolehkan untuk Hari Ini (Hari H) atau Besok.',
      });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default dateMiddleware;
